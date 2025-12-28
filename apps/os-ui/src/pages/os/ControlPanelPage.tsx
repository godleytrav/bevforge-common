import { useState, useEffect } from 'react';
import { Power, Droplet, Thermometer, Gauge, Plus, Trash2, Settings, Edit, Save, X } from 'lucide-react';
import { EquipmentRenderer } from '@/components/EquipmentRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TileType = 
  | 'vessel'
  | 'temp_sensor'
  | 'gravity_sensor'
  | 'flow_meter'
  | 'digital_input'
  | 'analog_input'
  | 'pump'
  | 'valve'
  | 'relay_ssr'
  | 'virtual_output'
  | 'status_tile';

type ConnectionType = 'gpio' | 'i2c' | 'spi' | 'pwm' | 'bluetooth' | 'network' | 'analog' | 'none';

interface Device {
  id: string;
  name: string;
  type: TileType;
  connectionType?: ConnectionType;
  driver?: string;
  channel?: string;
  status: 'online' | 'offline' | 'error' | 'warning';
  position: { x: number; y: number };
  // Control properties
  isOn?: boolean;
  value?: number;
  unit?: string;
  // Legacy properties for backward compat
  temperature?: number;
  targetTemp?: number;
  pressure?: number;
  flowRate?: number;
  level?: number;
  capacity?: number;
  // Display configuration
  config?: {
    displayMode?: 'svg' | 'tile';
    vesselType?: 'conical' | 'bright' | 'hlt' | 'mash' | 'kettle' | 'generic';
    currentLevel?: number;
    currentTemp?: number;
    capacity?: number;
    capacityUnit?: string;
  };
  // API integration
  endpointId?: number; // Primary control endpoint (for pumps, valves, etc.)
  bindings?: Array<{
    endpointId: number;
    bindingRole: string;
    direction: string;
  }>;
}

// Driver options by connection type
const driverOptions: Record<ConnectionType, Record<string, string[]>> = {
  gpio: {
    temp_sensor: ['DS18B20 (1-Wire)'],
    digital_input: ['Switch/Button', 'Float Switch'],
    pump: ['Relay', 'SSR'],
    valve: ['Solenoid Relay'],
    relay_ssr: ['Mechanical Relay', 'SSR'],
  },
  i2c: {
    temp_sensor: ['TMP102', 'BME280'],
    digital_input: ['MCP23017', 'PCF8574'],
    relay_ssr: ['I2C Relay Board'],
  },
  spi: {
    temp_sensor: ['MAX31855 (Thermocouple)', 'MAX6675'],
    analog_input: ['MCP3008', 'ADS1115'],
  },
  pwm: {
    pump: ['DC Pump Speed Control'],
    valve: ['Proportional Valve'],
    relay_ssr: ['SSR Duty Cycle'],
  },
  bluetooth: {
    gravity_sensor: ['Tilt Hydrometer'],
    temp_sensor: ['BLE Sensor'],
  },
  network: {
    temp_sensor: ['HTTP Sensor', 'MQTT Sensor'],
    flow_meter: ['Modbus Meter'],
    pump: ['Modbus VFD'],
  },
  analog: {
    temp_sensor: ['PT100/PT1000 via ADC'],
    analog_input: ['4-20mA Current Loop', 'Pressure Transducer'],
  },
  none: {},
};

const mockDevices: Device[] = [
  {
    id: 'vessel-1',
    name: 'HLT',
    type: 'vessel',
    connectionType: 'none',
    status: 'online',
    position: { x: 200, y: 250 },
    temperature: 75.5,
    targetTemp: 168.0,
    level: 80,
    capacity: 1000,
    config: {
      displayMode: 'svg',
      vesselType: 'hlt',
      currentLevel: 65,
      currentTemp: 180,
      capacity: 20,
      capacityUnit: 'gal',
    },
  },
  {
    id: 'vessel-2',
    name: 'Mash Tun',
    type: 'vessel',
    connectionType: 'none',
    status: 'online',
    position: { x: 400, y: 250 },
    temperature: 152.0,
    targetTemp: 152.0,
    level: 75,
    capacity: 15,
    config: {
      displayMode: 'svg',
      vesselType: 'mash',
      currentLevel: 75,
      currentTemp: 152,
      capacity: 15,
      capacityUnit: 'gal',
    },
  },
  {
    id: 'vessel-3',
    name: 'Conical Fermentor',
    type: 'vessel',
    connectionType: 'none',
    status: 'online',
    position: { x: 600, y: 250 },
    temperature: 68.0,
    targetTemp: 68.0,
    level: 90,
    capacity: 7,
    config: {
      displayMode: 'svg',
      vesselType: 'conical',
      currentLevel: 90,
      currentTemp: 68,
      capacity: 7,
      capacityUnit: 'gal',
    },
  },
  {
    id: 'pump-1',
    name: 'HLT Pump',
    type: 'pump',
    connectionType: 'gpio',
    driver: 'Relay',
    channel: 'GPIO17',
    status: 'online',
    position: { x: 300, y: 150 },
    isOn: false,
    flowRate: 0,
  },
  {
    id: 'sensor-1',
    name: 'HLT Temp',
    type: 'temp_sensor',
    connectionType: 'gpio',
    driver: 'DS18B20 (1-Wire)',
    channel: 'GPIO4',
    status: 'online',
    position: { x: 500, y: 150 },
    temperature: 75.5,
  },
];

export default function ControlPanelPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch tiles from API on mount
  useEffect(() => {
    const fetchTiles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/os/tiles?limit=100');
        if (!response.ok) {
          throw new Error(`Failed to fetch tiles: ${response.statusText}`);
        }
        const result = await response.json();
        
        // Fetch detailed info (including bindings) for each tile
        const detailedDevices = await Promise.all(
          result.data.map(async (tile: any) => {
            try {
              const detailResponse = await fetch(`/api/os/tiles/${tile.id}?include=current`);
              if (!detailResponse.ok) {
                console.warn(`Failed to fetch details for tile ${tile.id}`);
                return null;
              }
              const detail = await detailResponse.json();
              
              // Find primary control endpoint (output direction)
              const controlBinding = detail.bindings?.find(
                (b: any) => b.direction === 'output' && ['control', 'primary'].includes(b.bindingRole)
              );
              
              return {
                id: String(tile.id),
                name: tile.name,
                type: tile.tileType as TileType,
                status: tile.status || 'online',
                position: { x: tile.x || 300, y: tile.y || 300 },
                config: tile.config || {},
                endpointId: controlBinding?.endpointId,
                bindings: detail.bindings || [],
                // Legacy properties for backward compat
                isOn: false,
                temperature: tile.config?.currentTemp,
                targetTemp: tile.config?.currentTemp,
                level: tile.config?.currentLevel,
                capacity: tile.config?.capacity,
              };
            } catch (err) {
              console.error(`Error fetching tile ${tile.id} details:`, err);
              return null;
            }
          })
        );
        
        // Filter out failed fetches
        const mappedDevices = detailedDevices.filter((d): d is Device => d !== null);
        
        setDevices(mappedDevices);
        setLoadError(null);
      } catch (error) {
        console.error('Error fetching tiles:', error);
        setLoadError(String(error));
        // Fallback to mock devices on error
        setDevices(mockDevices);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTiles();
  }, []);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Partial<Device>>({});
  const [newDevice, setNewDevice] = useState<Partial<Device>>({
    name: '',
    type: 'temp_sensor',
    connectionType: 'gpio',
    driver: '',
    channel: '',
    status: 'online',
    position: { x: 300, y: 300 },
  });
  const [draggedDevice, setDraggedDevice] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleDeviceClick = (device: Device) => {
    // Only handle clicks in control mode (edit mode uses drag)
    if (!isEditMode) {
      // Control mode: Select device to show control panel
      setSelectedDevice(selectedDevice?.id === device.id ? null : device);
    }
  };

  const handleDeviceDoubleClick = (device: Device) => {
    if (isEditMode) {
      // Edit mode: Double-click opens edit dialog
      setEditingDevice(device);
      setIsEditDialogOpen(true);
    }
  };

  const handleToggleDevice = async (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device || !device.endpointId) {
      console.error('Device not found or no endpoint configured:', deviceId);
      return;
    }

    const newValue = !device.isOn;

    // Optimistic update
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId ? { ...d, isOn: newValue } : d
      )
    );

    try {
      const response = await fetch('/api/os/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointId: device.endpointId,
          value: newValue,
          commandType: 'write',
          tileId: parseInt(device.id),
          correlationId: `ui-toggle-${deviceId}-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Command failed:', error);
        // Revert optimistic update
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId ? { ...d, isOn: !newValue } : d
          )
        );
        alert(`Failed to toggle device: ${error.message || 'Unknown error'}`);
      } else {
        const result = await response.json();
        console.log('Command succeeded:', result);
      }
    } catch (error) {
      console.error('Error sending command:', error);
      // Revert optimistic update
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, isOn: !newValue } : d
        )
      );
      alert('Failed to send command. Check console for details.');
    }
  };

  const handleSaveEdit = () => {
    if (!editingDevice.id) return;

    setDevices((prev) =>
      prev.map((device) =>
        device.id === editingDevice.id ? { ...device, ...editingDevice } : device
      )
    );
    setIsEditDialogOpen(false);
    setEditingDevice({});
  };

  const handleAddDevice = () => {
    if (!newDevice.name || !newDevice.type) {
      return;
    }

    const device: Device = {
      id: `device-${Date.now()}`,
      name: newDevice.name,
      type: newDevice.type,
      connectionType: newDevice.connectionType,
      driver: newDevice.driver,
      channel: newDevice.channel,
      status: 'online',
      position: newDevice.position || { x: 300, y: 300 },
      isOn: false,
      temperature: newDevice.type === 'temp_sensor' ? 20.0 : undefined,
      targetTemp: newDevice.type === 'vessel' ? 20.0 : undefined,
      pressure: newDevice.type === 'vessel' ? 0 : undefined,
      flowRate: newDevice.type === 'pump' ? 0 : undefined,
      level: newDevice.type === 'vessel' ? 0 : undefined,
      capacity: newDevice.type === 'vessel' ? 1000 : undefined,
      config: newDevice.config, // Preserve config (displayMode, vesselType, etc.)
    };

    setDevices((prev) => [...prev, device]);
    setIsAddDialogOpen(false);
    setNewDevice({
      name: '',
      type: 'temp_sensor',
      connectionType: 'gpio',
      driver: '',
      channel: '',
      status: 'online',
      position: { x: 300, y: 300 },
    });
  };

  const handleDeleteDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    setIsEditDialogOpen(false);
  };

  const handleQuickAdd = (type: TileType) => {
    const typeNames: Record<TileType, string> = {
      vessel: 'New Vessel',
      temp_sensor: 'New Temperature Sensor',
      gravity_sensor: 'New Gravity Sensor',
      flow_meter: 'New Flow Meter',
      digital_input: 'New Digital Input',
      analog_input: 'New Analog Input',
      pump: 'New Pump',
      valve: 'New Valve',
      relay_ssr: 'New Relay/SSR',
      virtual_output: 'New Virtual Output',
      status_tile: 'New Status Tile',
    };

    const defaultConnection: Record<TileType, ConnectionType> = {
      vessel: 'none',
      temp_sensor: 'gpio',
      gravity_sensor: 'bluetooth',
      flow_meter: 'gpio',
      digital_input: 'gpio',
      analog_input: 'analog',
      pump: 'gpio',
      valve: 'gpio',
      relay_ssr: 'gpio',
      virtual_output: 'none',
      status_tile: 'none',
    };

    const newDeviceData: Partial<Device> = {
      name: typeNames[type],
      type,
      connectionType: defaultConnection[type],
      driver: '',
      channel: '',
      status: 'online',
      position: { x: 300, y: 300 },
    };

    // Default to SVG mode for vessels
    if (type === 'vessel') {
      newDeviceData.config = {
        displayMode: 'svg',
        vesselType: 'generic',
        currentLevel: 50,
        currentTemp: 70,
        capacity: 10,
        capacityUnit: 'gal',
      };
    }

    setNewDevice(newDeviceData);
    setIsAddDialogOpen(true);
  };

  const handleMouseDown = (e: React.MouseEvent, deviceId: string) => {
    if (!isEditMode) return;
    
    e.stopPropagation();
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    // Get the canvas position
    const canvas = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!canvas) return;

    // Calculate offset from mouse to device position (relative to canvas)
    const mouseX = e.clientX - canvas.left;
    const mouseY = e.clientY - canvas.top;
    
    setDragOffset({
      x: mouseX - device.position.x,
      y: mouseY - device.position.y,
    });
    setDraggedDevice(deviceId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedDevice || !isEditMode) return;

    const canvas = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - canvas.left;
    const mouseY = e.clientY - canvas.top;
    
    const newX = mouseX - dragOffset.x;
    const newY = mouseY - dragOffset.y;

    setDevices((prev) =>
      prev.map((device) =>
        device.id === draggedDevice
          ? { ...device, position: { x: Math.max(100, Math.min(canvas.width - 100, newX)), y: Math.max(100, Math.min(canvas.height - 100, newY)) } }
          : device
      )
    );
  };

  const handleMouseUp = () => {
    setDraggedDevice(null);
  };

  // Get available drivers for current tile type and connection
  const getAvailableDrivers = (): string[] => {
    if (!newDevice.type || !newDevice.connectionType) return [];
    return driverOptions[newDevice.connectionType]?.[newDevice.type] || [];
  };

  // Get available connection types for current tile type
  const getAvailableConnections = (): ConnectionType[] => {
    if (!newDevice.type) return [];
    
    const connections: ConnectionType[] = [];
    Object.entries(driverOptions).forEach(([conn, types]) => {
      if (types[newDevice.type!]) {
        connections.push(conn as ConnectionType);
      }
    });
    
    // Add 'none' for logical tiles
    if (['vessel', 'virtual_output', 'status_tile'].includes(newDevice.type)) {
      connections.push('none');
    }
    
    return connections;
  };

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Control Panel</h1>
            <p className="text-sm text-muted-foreground">
              {isEditMode ? 'Edit Mode: Drag to reposition, double-click to edit' : 'Control Mode: Click devices to activate'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              System Online
            </Badge>
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? (
                <>
                  <Save className="h-4 w-4" />
                  Save Layout
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Edit Mode
                </>
              )}
            </Button>
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Device
              </Button>
            )}
            <Button variant="outline" size="sm">
              Emergency Stop
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Add Palette - Only in Edit Mode */}
      {isEditMode && (
        <div className="border-b bg-muted/30 px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Quick Add:</span>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8"
              onClick={() => handleQuickAdd('vessel')}
            >
              <Droplet className="h-3 w-3" />
              Vessel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8"
              onClick={() => handleQuickAdd('temp_sensor')}
            >
              <Thermometer className="h-3 w-3" />
              Temp Sensor
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8"
              onClick={() => handleQuickAdd('pump')}
            >
              <Power className="h-3 w-3" />
              Pump
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8"
              onClick={() => handleQuickAdd('valve')}
            >
              <Settings className="h-3 w-3" />
              Valve
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8"
              onClick={() => handleQuickAdd('relay_ssr')}
            >
              <Power className="h-3 w-3" />
              Relay/SSR
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8"
              onClick={() => handleQuickAdd('flow_meter')}
            >
              <Gauge className="h-3 w-3" />
              Flow Meter
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">
              {devices.length} devices
            </div>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="absolute inset-0 bg-background"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid background - only visible in edit mode */}
          {isEditMode && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted/20" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading devices...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {loadError && !isLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-md">
                <p className="text-sm">Failed to load devices. Using mock data.</p>
              </div>
            </div>
          )}

          {/* Devices */}
          {!isLoading && devices.map((device) => (
            <EquipmentRenderer
              key={device.id}
              device={{
                id: device.id as unknown as number,
                name: device.name,
                tileType: device.type,
                positionX: String(device.position.x),
                positionY: String(device.position.y),
                width: '120',
                height: '180',
                status: device.status === 'online' ? 'operational' : device.status,
                config: device.config,
              }}
              mode={isEditMode ? 'edit' : 'control'}
              isSelected={selectedDevice?.id === device.id}
              isDragging={draggedDevice === device.id}
              onClick={() => !draggedDevice && handleDeviceClick(device)}
              onMouseDown={(e) => isEditMode ? handleMouseDown(e, device.id) : undefined}
              onDoubleClick={() => handleDeviceDoubleClick(device)}
            />
          ))}
        </div>
      </div>

      {/* Control Panel - Bottom Right (Control Mode Only) */}
      {!isEditMode && selectedDevice && (
        <div className="absolute bottom-6 right-6 w-80 z-20">
          <Card className="shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedDevice.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDevice(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground capitalize">
                {selectedDevice.type.replace('_', ' ')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(selectedDevice.type === 'pump' || selectedDevice.type === 'valve' || selectedDevice.type === 'relay_ssr') && (
                <div className="flex items-center justify-between">
                  <Label>Power</Label>
                  <Switch
                    checked={selectedDevice.isOn}
                    onCheckedChange={() => handleToggleDevice(selectedDevice.id)}
                  />
                </div>
              )}
              {selectedDevice.type === 'vessel' && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Target Temperature</Label>
                      <span className="text-sm font-mono">
                        {selectedDevice.targetTemp?.toFixed(0)}°F
                      </span>
                    </div>
                    <Slider
                      value={[selectedDevice.targetTemp || 32]}
                      min={32}
                      max={212}
                      step={1}
                      onValueChange={(value) => {
                        setDevices((prev) =>
                          prev.map((d) =>
                            d.id === selectedDevice.id
                              ? { ...d, targetTemp: value[0] }
                              : d
                          )
                        );
                      }}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Temp:</span>
                      <span className="font-mono">{selectedDevice.temperature?.toFixed(1)}°F</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Level:</span>
                      <span className="font-mono">{selectedDevice.level}%</span>
                    </div>
                  </div>
                </>
              )}
              {selectedDevice.type === 'temp_sensor' && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reading:</span>
                    <span className="text-2xl font-mono">{selectedDevice.temperature?.toFixed(1)}°F</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Modify device properties and configuration
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Device Name</Label>
              <Input
                id="edit-name"
                value={editingDevice.name || ''}
                onChange={(e) => setEditingDevice({ ...editingDevice, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Device Type</Label>
              <Select
                value={editingDevice.type}
                onValueChange={(value) => setEditingDevice({ ...editingDevice, type: value as TileType })}
              >
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vessel">Vessel</SelectItem>
                  <SelectItem value="temp_sensor">Temperature Sensor</SelectItem>
                  <SelectItem value="pump">Pump</SelectItem>
                  <SelectItem value="valve">Valve</SelectItem>
                  <SelectItem value="relay_ssr">Relay/SSR</SelectItem>
                  <SelectItem value="flow_meter">Flow Meter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingDevice.type === 'vessel' && (
              <>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-display-mode">Display Mode</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {editingDevice.config?.displayMode === 'svg' ? 'SVG' : 'Tile'}
                      </span>
                      <Switch
                        id="edit-display-mode"
                        checked={editingDevice.config?.displayMode === 'svg'}
                        onCheckedChange={(checked) =>
                          setEditingDevice({
                            ...editingDevice,
                            config: {
                              ...editingDevice.config,
                              displayMode: checked ? 'svg' : 'tile',
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                {editingDevice.config?.displayMode === 'svg' && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-vessel-type">Vessel Type</Label>
                    <Select
                      value={editingDevice.config?.vesselType || 'generic'}
                      onValueChange={(value) =>
                        setEditingDevice({
                          ...editingDevice,
                          config: {
                            ...editingDevice.config,
                            vesselType: value as 'conical' | 'bright' | 'hlt' | 'mash' | 'kettle' | 'generic',
                          },
                        })
                      }
                    >
                      <SelectTrigger id="edit-vessel-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hlt">Hot Liquor Tank (HLT)</SelectItem>
                        <SelectItem value="mash">Mash Tun</SelectItem>
                        <SelectItem value="kettle">Brew Kettle</SelectItem>
                        <SelectItem value="conical">Conical Fermentor</SelectItem>
                        <SelectItem value="bright">Bright Tank</SelectItem>
                        <SelectItem value="generic">Generic Vessel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-x">Position X</Label>
                <Input
                  id="edit-x"
                  type="number"
                  value={editingDevice.position?.x || 0}
                  onChange={(e) =>
                    setEditingDevice({
                      ...editingDevice,
                      position: { ...editingDevice.position!, x: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-y">Position Y</Label>
                <Input
                  id="edit-y"
                  type="number"
                  value={editingDevice.position?.y || 0}
                  onChange={(e) =>
                    setEditingDevice({
                      ...editingDevice,
                      position: { ...editingDevice.position!, y: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => handleDeleteDevice(editingDevice.id!)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Device Dialog - Full Hardware Configuration */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Device Tile</DialogTitle>
            <DialogDescription>
              Configure tile type, connection interface, driver, and channel
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Step 1: Tile Name */}
            <div className="grid gap-2">
              <Label htmlFor="device-name">Device Name</Label>
              <Input
                id="device-name"
                placeholder="e.g., HLT Temperature Sensor"
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              />
            </div>

            {/* Step 2: Tile Type */}
            <div className="grid gap-2">
              <Label htmlFor="device-type">Tile Type</Label>
              <Select
                value={newDevice.type}
                onValueChange={(value) => {
                  const type = value as TileType;
                  const defaultConn = type === 'vessel' || type === 'virtual_output' || type === 'status_tile' ? 'none' : 'gpio';
                  setNewDevice({ ...newDevice, type, connectionType: defaultConn, driver: '', channel: '' });
                }}
              >
                <SelectTrigger id="device-type">
                  <SelectValue placeholder="Select tile type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vessel">Vessel / Tank</SelectItem>
                  <SelectItem value="temp_sensor">Temperature Sensor</SelectItem>
                  <SelectItem value="gravity_sensor">Gravity Sensor</SelectItem>
                  <SelectItem value="flow_meter">Flow Meter</SelectItem>
                  <SelectItem value="digital_input">Digital Input</SelectItem>
                  <SelectItem value="analog_input">Analog Input</SelectItem>
                  <SelectItem value="pump">Pump</SelectItem>
                  <SelectItem value="valve">Valve</SelectItem>
                  <SelectItem value="relay_ssr">Relay / SSR</SelectItem>
                  <SelectItem value="virtual_output">Virtual Output</SelectItem>
                  <SelectItem value="status_tile">Status Tile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Display Mode & Vessel Type (for vessels only) */}
            {newDevice.type === 'vessel' && (
              <>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="add-display-mode">Display Mode</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {newDevice.config?.displayMode === 'svg' ? 'SVG' : 'Tile'}
                      </span>
                      <Switch
                        id="add-display-mode"
                        checked={newDevice.config?.displayMode === 'svg'}
                        onCheckedChange={(checked) =>
                          setNewDevice({
                            ...newDevice,
                            config: {
                              ...newDevice.config,
                              displayMode: checked ? 'svg' : 'tile',
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                {newDevice.config?.displayMode === 'svg' && (
                  <div className="grid gap-2">
                    <Label htmlFor="add-vessel-type">Vessel Type</Label>
                    <Select
                      value={newDevice.config?.vesselType || 'generic'}
                      onValueChange={(value) =>
                        setNewDevice({
                          ...newDevice,
                          config: {
                            ...newDevice.config,
                            vesselType: value as 'conical' | 'bright' | 'hlt' | 'mash' | 'kettle' | 'generic',
                          },
                        })
                      }
                    >
                      <SelectTrigger id="add-vessel-type">
                        <SelectValue placeholder="Select vessel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hlt">Hot Liquor Tank (HLT)</SelectItem>
                        <SelectItem value="mash">Mash Tun</SelectItem>
                        <SelectItem value="kettle">Brew Kettle</SelectItem>
                        <SelectItem value="conical">Conical Fermentor</SelectItem>
                        <SelectItem value="bright">Bright Tank</SelectItem>
                        <SelectItem value="generic">Generic Vessel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {/* Step 3: Connection Type */}
            {newDevice.type && newDevice.type !== 'vessel' && newDevice.type !== 'virtual_output' && newDevice.type !== 'status_tile' && (
              <div className="grid gap-2">
                <Label htmlFor="connection-type">Connection / Interface</Label>
                <Select
                  value={newDevice.connectionType}
                  onValueChange={(value) => setNewDevice({ ...newDevice, connectionType: value as ConnectionType, driver: '', channel: '' })}
                >
                  <SelectTrigger id="connection-type">
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableConnections().map((conn) => (
                      <SelectItem key={conn} value={conn}>
                        {conn.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Step 4: Driver */}
            {newDevice.connectionType && newDevice.connectionType !== 'none' && getAvailableDrivers().length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="driver">Driver</Label>
                <Select
                  value={newDevice.driver}
                  onValueChange={(value) => setNewDevice({ ...newDevice, driver: value })}
                >
                  <SelectTrigger id="driver">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableDrivers().map((driver) => (
                      <SelectItem key={driver} value={driver}>
                        {driver}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Step 5: Channel */}
            {newDevice.driver && (
              <div className="grid gap-2">
                <Label htmlFor="channel">Channel / Pin</Label>
                <Input
                  id="channel"
                  placeholder="e.g., GPIO17, I2C 0x20, PWM0"
                  value={newDevice.channel}
                  onChange={(e) => setNewDevice({ ...newDevice, channel: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Specify the hardware channel (GPIO pin, I2C address, etc.)
                </p>
              </div>
            )}

            {/* Position */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pos-x">Position X</Label>
                <Input
                  id="pos-x"
                  type="number"
                  value={newDevice.position?.x || 300}
                  onChange={(e) =>
                    setNewDevice({
                      ...newDevice,
                      position: { ...newDevice.position!, x: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pos-y">Position Y</Label>
                <Input
                  id="pos-y"
                  type="number"
                  value={newDevice.position?.y || 300}
                  onChange={(e) =>
                    setNewDevice({
                      ...newDevice,
                      position: { ...newDevice.position!, y: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDevice} disabled={!newDevice.name || !newDevice.type}>
              Add Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
