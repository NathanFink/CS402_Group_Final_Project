import React, { useState, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Picker } from '@react-native-picker/picker'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Alert,
  TextInput,
  SafeAreaView,
} from 'react-native';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [facing, setFacing] = useState('back');
  const [cameraRef, setCameraRef] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [tempPhoto, setTempPhoto] = useState(null);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [categoryName, setCategoryName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('');
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [categoryOptionsModalVisible, setCategoryOptionsModalVisible] = useState(false);
  const [editCategoryName, setEditCategoryName] = useState('');
  
  const LOAD_URL = 'https://mec402.boisestate.edu/csclasses/cs402/project/loadjson.php?user=finalprojectteam7';
  const SAVE_URL = 'https://mec402.boisestate.edu/csclasses/cs402/project/savejson.php?user=finalprojectteam7';

  // Function to load inventory from remote url
  async function loadInventory() {
    try {
      const response = await fetch(LOAD_URL);
      const text = await response.text();
      try {
        const data = JSON.parse(text); // try parsing manually...
        setInventory(data.inventory || []);
      } catch (jsonError) {
        console.error('Response was not valid JSON:', text);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load inventory: ' + error.message);
    }
    // setInventory([]);
    // saveInventory([]); //uncomment these lines to reset the inventory
  };

  // Function to save inventory to remote url
  async function saveInventory(newInventory) {
    try {
      const response = await fetch(SAVE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventory: newInventory }),
      });
      if (!response.ok) {
        throw new Error('Failed to save inventory');
      }
      setInventory(newInventory); // Update local state after successful save
    } catch (error) {
      Alert.alert('Error', 'Failed to save inventory: ' + error.message);
    }
  };

  // Load inventory when the app starts
  useEffect(() => {
    loadInventory();
  }, []);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      setTempPhoto(photo);
      setCameraVisible(false);
      setAddItemModalVisible(true);
    }
  };

  const openAddItemModal = () => {
    setItemName('');
    setItemQuantity('');
    setTempPhoto(null);
    setEditMode(false);
    setCameraVisible(true);
  };

  const openItemModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const   addItem = () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }
    
    const quantity = parseInt(itemQuantity) || 0;
    if (quantity < 0) {
      Alert.alert('Error', 'Quantity cannot be negative');
      return;
    }

    if (!tempPhoto) {
      Alert.alert('Error', 'Please take a photo of the item');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: itemName,
      quantity: parseInt(itemQuantity, 10),
      image: tempPhoto.uri,
      category: selectedCategory
    };

    const updatedInventory = inventory.map((cat) => {
      if (cat.category === selectedCategory) {
        return {
          ...cat,
          items: [...cat.items, newItem],
        };
      }
      return cat;
    });
    setInventory(updatedInventory);
    saveInventory(updatedInventory);
    setAddItemModalVisible(false);
    setItemName('');
    setItemQuantity('');
    setTempPhoto(null);
  };

  const   updateItem = () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }
    
    const quantity = parseInt(itemQuantity) || 0;
    if (quantity < 0) {
      Alert.alert('Error', 'Quantity cannot be negative');
      return;
    }

    const updatedItem = {
      ...selectedItem,
      name: itemName,
      quantity,
      image: tempPhoto ? tempPhoto.uri : selectedItem.image,
      category: selectedCategory,
    };

    const updatedInventory = inventory.map((cat) => {
      if (cat.category === selectedItem.category && cat.category === selectedCategory) {
        // Category hasn't changed, update item in place
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === selectedItem.id ? updatedItem : item
          ),
        };
      } else if (cat.category === selectedItem.category) {
        // Remove from old category
        return {
          ...cat,
          items: cat.items.filter((item) => item.id !== selectedItem.id),
        };
      } else if (cat.category === selectedCategory) {
        // Add to new category
        return {
          ...cat,
          items: [...cat.items, updatedItem],
        };
      }
    
      return cat;
    });
    

    setInventory(updatedInventory);
    saveInventory(updatedInventory);
    setModalVisible(false);
    setAddItemModalVisible(false);
    setEditMode(false);
  };

  const deleteItem = () => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${selectedItem.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            const updatedInventory = inventory.map((cat) => {
              if (cat.category === selectedItem.category) {
                return {
                  ...cat,
                  items: cat.items.filter((item) => item.id !== selectedItem.id),
                };
              }
              return cat;
            });
            console.log('Updated Inventory:', updatedInventory)
            setInventory(updatedInventory);
            saveInventory(updatedInventory);
            setModalVisible(false);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const editItem = () => {
    setItemName(selectedItem.name);
    setItemQuantity(selectedItem.quantity.toString());
    setTempPhoto({ uri: selectedItem.image });
    setSelectedCategory(selectedItem.category);
    setEditMode(true);
    setModalVisible(false);
    setAddItemModalVisible(true);
  };

  const renderMainScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Warehouse Inventory</Text>
      </View>
      <View style={styles.buttonRow}> 
        <TouchableOpacity style={styles.addButton} onPress={openAddItemModal}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddCategoryModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Add category</Text>
        </TouchableOpacity>
      </View>

      {inventory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items in inventory</Text>
          <Text style={styles.emptySubText}>Tap the "Add Item" button to add your first item</Text>
        </View>
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.category}
          renderItem={({ item: category }) => (
            <View style={styles.categorySection}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategory(category);
                  setEditCategoryName(category.category);
                  setCategoryOptionsModalVisible(true);
                }}
              >
                <Text style={styles.categoryTitle}>{category.category}</Text>
              </TouchableOpacity>

              <View style={styles.grid}>
                {category.items.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.gridItem} onPress={() => openItemModal(item)}>

                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );

  const renderCameraScreen = () => {
    if (!permission) return <View />;
    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Text style={styles.message}>We need your permission to show the camera</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.text}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={(ref) => setCameraRef(ref)}
        />

        <View style={styles.cameraHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setCameraVisible(false)}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>Take Item Photo</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Text style={styles.flipText}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shutterButton} onPress={takePicture} />
        </View>
      </View>
    );
  };

  // Item detail modal
  const renderItemModal = () => (
    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {selectedItem && (
            <>
              <Image source={{ uri: selectedItem.image }} style={styles.modalImage} />
              <Text style={styles.modalItemName}>{selectedItem.name}</Text>
              <Text style={styles.modalItemQuantity}>Quantity: {selectedItem.quantity}</Text>

              <TouchableOpacity style={[styles.modalButton, styles.editButton]} onPress={editItem}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={deleteItem}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.closeModalButton]} 
                onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderAddItemModal = () => (
    <Modal visible={addItemModalVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editMode ? 'Edit Item' : 'Add New Item'}
          </Text>

          {tempPhoto ? (
            <Image source={{ uri: tempPhoto.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.noPhotoPlaceholder}>
              <Text style={styles.placeholderText}>No Photo</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.retakeButton} 
            onPress={() => {
              setAddItemModalVisible(false);
              setCameraVisible(true);
            }}>
            <Text style={styles.buttonText}>
              {tempPhoto ? 'Retake Photo' : 'Take Photo'}
            </Text>
          </TouchableOpacity>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={{ height: 50, width: '100%' }}
          >
            {inventory.map((cat) => (
              <Picker.Item
                label={cat.category}
                value={cat.category}
                key={cat.category}
              />
            ))}
          </Picker>

          <TextInput
            style={styles.input}
            placeholder="Item Name"
            placeholderTextColor="#999"
            value={itemName}
            onChangeText={setItemName}
          />

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => {
                  const currentQty = parseInt(itemQuantity) || 0;
                  if (currentQty > 0) {
                    setItemQuantity((currentQty - 1).toString());
                  }
                }}>
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              
              <Text style={styles.quantityValue}>{itemQuantity || '0'}</Text>
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => {
                  const currentQty = parseInt(itemQuantity) || 0;
                  setItemQuantity((currentQty + 1).toString());
                }}>
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalButtonsRow}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => {
                setAddItemModalVisible(false);
                setEditMode(false);
              }}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={editMode ? updateItem : addItem}>
              <Text style={styles.buttonText}>{editMode ? 'Update' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

   //Category Modal
  const renderCategoryModal = () => (
    <Modal visible={addCategoryModalVisible} transparent animationType="slide">
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Add Category</Text>
        <TextInput
          style={styles.input}
          placeholder="Category Name"
          value={categoryName}
          onChangeText={setCategoryName}
        />
        <View style={styles.modalButtonsRow}>
          <TouchableOpacity onPress={() => setAddCategoryModalVisible(false)} style={[styles.modalButton, styles.cancelButton]}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!categoryName.trim()) return;
              const exists = inventory.some(c => c.category === categoryName);
              if (exists) {
                Alert.alert("Category already exists");
                return;
              }
              const updatedInventory = [...inventory, { category: categoryName, items: [] }];
              setInventory(updatedInventory);
              saveInventory(updatedInventory);
              setAddCategoryModalVisible(false);
            }}
            style={[styles.modalButton, styles.saveButton]}
          >
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  
   );

  const renderCategoryOptionsModal = () => (
    <Modal visible={categoryOptionsModalVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Category</Text>
  
          <TextInput
            style={styles.input}
            value={editCategoryName}
            onChangeText={setEditCategoryName}
          />
  
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity
              onPress={() => setCategoryOptionsModalVisible(false)}
              style={[styles.modalButton, styles.cancelButton]}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
  
            <TouchableOpacity
              onPress={() => {
                if (!editCategoryName.trim()) return;
  
                const exists = inventory.some(
                  (c) => c.category === editCategoryName && c !== selectedCategory
                );
                if (exists) {
                  Alert.alert("Error", "Category with this name already exists.");
                  return;
                }
  
                const updatedInventory = inventory.map((cat) =>
                  cat === selectedCategory
                    ? { ...cat, category: editCategoryName }
                    : cat
                );
  
                setInventory(updatedInventory);
                saveInventory(updatedInventory);
                setCategoryOptionsModalVisible(false);
              }}
              style={[styles.modalButton, styles.saveButton]}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
  
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Delete Category',
                `Are you sure you want to delete "${selectedCategory.category}"? This will also delete all its items.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      const updatedInventory = inventory.filter(
                        (cat) => cat !== selectedCategory
                      );
                      setInventory(updatedInventory);
                      saveInventory(updatedInventory);
                      setCategoryOptionsModalVisible(false);
                    },
                  },
                ]
              );
            }}
            style={[styles.modalButton, styles.deleteButton]}>
            <Text style={styles.buttonText}>Delete Category</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <>
      {cameraVisible ? renderCameraScreen() : renderMainScreen()}
      {renderItemModal()}
      {renderAddItemModal()}
      {renderCategoryModal()}
      {renderCategoryOptionsModal()}
    </>
  );
}

  const styles = StyleSheet.create({
  // Quantity control styles
  quantityContainer: {
    width: '100%',
    marginBottom: 15,
  },
  quantityLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  quantityButton: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    width: 50,
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '500',
    paddingHorizontal: 20,
    minWidth: 80,
    textAlign: 'center',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    backgroundColor: '#2196f3',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop:20,
    paddingHorizontal: 10,
  },
  addButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
    flex: 1,
  },
  addButtonText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  grid: {
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '45%',
    // flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    color: '#555',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  // Camera styles
  camera: { 
    flex: 1 
  },
  cameraHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#ccc',
  },
  flipButton: {
    position: 'absolute',
    left: 30,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 12,
    borderRadius: 25,
  },
  flipText: {
    fontSize: 22,
  },
  message: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#000',
  },
  permissionButton: {
    alignSelf: 'center',
    backgroundColor: '#2196f3',
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
  },
  text: { 
    color: '#fff', 
    fontSize: 16, 
    textAlign: 'center' 
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalImage: {
    width: 200,
    height: 200,
    marginBottom: 15,
    borderRadius: 8,
  },
  modalItemName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  modalItemQuantity: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#ffab00',
    width: '100%',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    width: '100%',
  },
  closeModalButton: {
    backgroundColor: '#757575',
    width: '100%',
  },
  // Add Item Modal
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
  },
  noPhotoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  retakeButton: {
    backgroundColor: '#5c6bc0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f0f0f0',
    width: '100%',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#757575',
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    backgroundColor: '#00c853',
    flex: 1,
    marginLeft: 5,
  },
  //Category
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});