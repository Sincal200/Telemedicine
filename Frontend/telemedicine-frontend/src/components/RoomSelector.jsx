import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Necesitarás instalar este paquete: npm install uuid
import { Button, Input, Select, Card, Typography, Space, Divider } from 'antd';

const { Option } = Select;
const { Title } = Typography;

const RoomSelector = ({ onRoomJoin }) => {
  const [roomId, setRoomId] = useState('');
  const [userRole, setUserRole] = useState('patient');
  const [userId] = useState(() => uuidv4().substring(0, 8)); // Generar un ID de usuario único
  const [recentRooms, setRecentRooms] = useState([]);

  // Cargar salas recientes del localStorage al iniciar
  useEffect(() => {
    const savedRooms = localStorage.getItem('recentRooms');
    if (savedRooms) {
      try {
        setRecentRooms(JSON.parse(savedRooms));
      } catch (e) {
        console.error('Error parsing saved rooms:', e);
      }
    }
  }, []);

  // Guardar sala en historial reciente
  const saveRoomToHistory = (roomData) => {
    const updatedRooms = [
      roomData,
      ...recentRooms.filter(r => r.id !== roomData.id).slice(0, 4) // Mantener solo 5 salas recientes
    ];
    setRecentRooms(updatedRooms);
    localStorage.setItem('recentRooms', JSON.stringify(updatedRooms));
  };

  // Crear una nueva sala
  const createRoom = () => {
    const newRoomId = uuidv4().substring(0, 6); // ID corto para la sala
    const roomData = {
      id: newRoomId,
      createdAt: new Date().toISOString(),
      creatorRole: userRole
    };
    
    saveRoomToHistory(roomData);
    setRoomId(newRoomId);
    
    // Notificamos al componente padre
    onRoomJoin(newRoomId, userRole, userId);
  };

  // Unirse a una sala existente
  const joinRoom = () => {
    if (!roomId.trim()) {
      return;
    }
    
    const roomData = {
      id: roomId,
      joinedAt: new Date().toISOString(),
      joinedAs: userRole
    };
    
    saveRoomToHistory(roomData);
    
    // Notificamos al componente padre
    onRoomJoin(roomId, userRole, userId);
  };

  return (
    <Card style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
      <Title level={3}>Telemedicina - Selector de Sala</Title>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="user-role">Seleccione su rol:</label>
          <Select 
            id="user-role"
            value={userRole} 
            onChange={setUserRole} 
            style={{ width: '100%', marginTop: 8 }}
          >
            <Option value="doctor">Doctor</Option>
            <Option value="patient">Paciente</Option>
          </Select>
        </div>
        
        <Button 
          type="primary" 
          onClick={createRoom} 
          block
          style={{ marginBottom: 16 }}
        >
          Crear Nueva Sala de Consulta
        </Button>
        
        <Divider>o</Divider>
        
        <div>
          <label htmlFor="room-id">ID de Sala Existente:</label>
          <Input
            id="room-id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Ingrese el código de 6 dígitos"
            style={{ marginTop: 8, marginBottom: 16 }}
          />
          <Button 
            onClick={joinRoom}
            disabled={!roomId.trim()}
            block
          >
            Unirse a la Sala
          </Button>
        </div>
        
        {recentRooms.length > 0 && (
          <>
            <Divider>Salas Recientes</Divider>
            <Space direction="vertical" style={{ width: '100%' }}>
              {recentRooms.map(room => (
                <Button 
                  key={room.id}
                  onClick={() => {
                    setRoomId(room.id);
                    joinRoom();
                  }}
                  block
                >
                  Sala: {room.id} - {new Date(room.createdAt || room.joinedAt).toLocaleString()}
                </Button>
              ))}
            </Space>
          </>
        )}
      </Space>
    </Card>
  );
};

export default RoomSelector;