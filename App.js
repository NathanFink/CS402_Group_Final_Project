import React, { useState, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
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

  // Use local state for inventory
  useEffect(() => {
    if (!mediaPermission) {
      requestMediaPermission();
    }
  }, []);


  // Save inventory data to state only no persistence right now
  const saveInventory = (newInventory) => {
    setInventory(newInventory);
  };

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
    };

    const updatedInventory = [...inventory, newItem];
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

    const updatedInventory = inventory.map(item => 
      item.id === selectedItem.id ? 
      {
        ...item,
        name: itemName,
        quantity: parseInt(itemQuantity, 10),
        image: tempPhoto ? tempPhoto.uri : item.image
      } : item
    );

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
            const updatedInventory = inventory.filter(item => item.id !== selectedItem.id);
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
    setEditMode(true);
    setModalVisible(false);
    setAddItemModalVisible(true);
  };


  const renderMainScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Warehouse Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddItemModal}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
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
          keyExtractor={(item) => item.id}
          numColumns={2}
          style={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gridItem} onPress={() => openItemModal(item)}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
            </TouchableOpacity>
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

  return (
    <>
      {cameraVisible ? renderCameraScreen() : renderMainScreen()}
      {renderItemModal()}
      {renderAddItemModal()}
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
  addButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  grid: {
    padding: 10,
  },
  gridItem: {
    flex: 1,
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
});