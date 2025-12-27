import { useEffect, useMemo, useState } from "react";

type HardwareItem = {
  key: string;
  label: string;
  kind: string;
  interface: string;
  driver: string;
  config_schema: { required: string[] };
  units?: string;
  capabilities: string[];
};

type HardwareLibrary = {
  categories: Record<string, HardwareItem[]>;
};

const flattenHardwareLibrary = (library: HardwareLibrary | null) => {
  if (!library) {
    return [] as HardwareItem[];
  }
  return Object.values(library.categories).flat();
};

const ControlPanelPage = () => {
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [hardwareLibrary, setHardwareLibrary] = useState<HardwareLibrary | null>(
    null
  );
  const [selectedKind, setSelectedKind] = useState("");
  const [selectedInterface, setSelectedInterface] = useState("");

  useEffect(() => {
    if (!isAddDeviceOpen) {
      return;
    }

    let isActive = true;
    const loadLibrary = async () => {
      const response = await fetch("/api/os/library/hardware");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as HardwareLibrary;
      if (isActive) {
        setHardwareLibrary(data);
      }
    };

    loadLibrary();

    return () => {
      isActive = false;
    };
  }, [isAddDeviceOpen]);

  const driverOptions = useMemo(() => {
    const items = flattenHardwareLibrary(hardwareLibrary);
    return items.filter((item) => {
      const matchesKind = selectedKind ? item.kind === selectedKind : true;
      const matchesInterface = selectedInterface
        ? item.interface === selectedInterface
        : true;
      return matchesKind && matchesInterface;
    });
  }, [hardwareLibrary, selectedKind, selectedInterface]);

  return (
    <section>
      <header>
        <h1>Control Panel</h1>
      </header>
      <button type="button" onClick={() => setIsAddDeviceOpen(true)}>
        Add Device
      </button>
      {isAddDeviceOpen ? (
        <div>
          <label>
            Kind
            <select
              value={selectedKind}
              onChange={(event) => setSelectedKind(event.target.value)}
            >
              <option value="">All</option>
              <option value="sensor">Sensor</option>
              <option value="relay">Relay</option>
              <option value="motor">Motor</option>
              <option value="meter">Meter</option>
              <option value="valve">Valve</option>
              <option value="controller">Controller</option>
            </select>
          </label>
          <label>
            Interface
            <select
              value={selectedInterface}
              onChange={(event) => setSelectedInterface(event.target.value)}
            >
              <option value="">All</option>
              <option value="gpio">GPIO</option>
              <option value="i2c">I2C</option>
              <option value="spi">SPI</option>
              <option value="uart">UART</option>
              <option value="1wire">1-Wire</option>
              <option value="usb">USB</option>
              <option value="ble">BLE</option>
              <option value="network">Network</option>
              <option value="analog">Analog</option>
              <option value="pwm">PWM</option>
            </select>
          </label>
          <label>
            Driver
            <select>
              {driverOptions.map((option) => (
                <option key={option.key} value={option.driver}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </section>
  );
};

export default ControlPanelPage;
