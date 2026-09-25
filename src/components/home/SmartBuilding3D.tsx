import React, { useEffect, useRef, useState } from 'react';
import {
  Monitor,
  Cpu,
  Thermometer,
  Gauge,
  Activity,
  Wind,
  Check,
  ChevronRight
} from 'lucide-react';

interface SubsystemInfo {
  id: string;
  name: string;
  badge: string;
  color: string;
  floorRange: string;
  metrics: { label: string; value: string }[];
  description: string;
  features?: string[];
}

const SUBSYSTEMS: SubsystemInfo[] = [
  {
    id: 'bms_software',
    name: 'Phần mềm BMS',
    badge: 'Máy tính trung tâm',
    color: '#2563eb',
    floorRange: 'Trung tâm điều hành',
    metrics: [
      { label: 'Giao diện', value: 'Web / 3D' },
      { label: 'Giao thức', value: 'BACnet / IP' },
      { label: 'Cơ sở dữ liệu', value: 'SQL Server' }
    ],
    description: 'Phần mềm quản lý hệ thống trên máy tính trung tâm'
  },
  {
    id: 'ddc_ip',
    name: 'DDC BACnet IP',
    badge: 'Bộ điều khiển lập trình',
    color: '#0284c7',
    floorRange: 'Tủ điều khiển trung tâm',
    metrics: [
      { label: 'Cổng mạng', value: 'Ethernet IP' },
      { label: 'Lập trình', value: 'Đa nhiệm thời gian thực' },
      { label: 'Băng thông', value: '100 Mbps' }
    ],
    description: 'Bộ điều khiển lập trình có khả năng kết nối mạng'
  },
  {
    id: 'ddc_mstp',
    name: 'DDC BACnet MSTP',
    badge: 'Bộ điều khiển phòng',
    color: '#0d9488',
    floorRange: 'Các tầng văn phòng',
    metrics: [
      { label: 'Giao tiếp', value: 'RS485 MSTP' },
      { label: 'Ứng dụng', value: 'FCU / VAV Box' },
      { label: 'Kết nối', value: 'Nối mạng nối tiếp' }
    ],
    description: 'Bộ điều khiển nhiệt độ phòng có khả năng nối mạng'
  },
  {
    id: 'hvac_valves',
    name: 'Van điều khiển HVAC',
    badge: 'Hệ thống lạnh áp lực cao',
    color: '#f59e0b',
    floorRange: 'Chiller, AHU & FCU',
    metrics: [
      { label: 'Tín hiệu', value: '0-10V / On-Off' },
      { label: 'Áp lực làm việc', value: 'Chịu áp cao' },
      { label: 'Đặc tính', value: 'Equal Percentage' }
    ],
    description: 'Van điều khiển cho hệ thống lạnh, chịu áp lực cao'
  },
  {
    id: 'sensors',
    name: 'Cảm biến HVAC/MVAC',
    badge: '6 nhóm cảm biến',
    color: '#8b5cf6',
    floorRange: 'Ống gió & trong phòng',
    metrics: [
      { label: 'Nhiệt độ & Độ ẩm', value: 'Gió & Nước' },
      { label: 'Áp suất & Khói', value: 'Gắn ống gió' },
      { label: 'Chất lượng khí', value: 'CO2 / CO / NO' }
    ],
    description: 'Hệ thống cảm biến đo lường và giám sát vi khí hậu toà nhà',
    features: [
      'Cảm biến nhiệt độ gió & nước',
      'Cảm biến độ ẩm ống gió & trong phòng',
      'Cảm biến áp suất gió & nước',
      'Cảm biến chất lượng không khí (CO2/CO/NO)',
      'Cảm biến khói gắn ống gió',
      'Cảm biến phát hiện chuyển động'
    ]
  },
  {
    id: 'actuators',
    name: 'Thiết bị chấp hành',
    badge: 'Cửa gió & Van tự động',
    color: '#10b981',
    floorRange: 'Hành lang & PCCC',
    metrics: [
      { label: 'Cửa gió', value: 'Điều khiển tự động' },
      { label: 'Van hút khói', value: 'Hành lang & PCCC' },
      { label: 'Động cơ van', value: 'Tự động đóng/mở' }
    ],
    description: 'Cửa gió, van hút khói hành lang, và các thiết bị điều khiển tự động khác.'
  }
];

export const SmartBuilding3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeSubsystem, setActiveSubsystem] = useState<string>('bms_software');
  const autoRotateRef = useRef<boolean>(true);

  // Scene refs to interact from UI
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const buildingGroupRef = useRef<any>(null);
  const floorMeshesRef = useRef<any[]>([]);

  useEffect(() => {
    let animId: number;
    let renderer: any = null;

    const initBuilding = () => {
      const w = window as any;
      if (!w.THREE || !mountRef.current) return;
      const THREE = w.THREE;

      const container = mountRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight || 560;

      // 1. Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // 2. Camera
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
      camera.position.set(70, 65, 85);
      camera.lookAt(0, 30, 0);
      cameraRef.current = camera;

      // 3. Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Clear container and append
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // 4. Lights optimized for white background
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0x2563eb, 1.0);
      mainLight.position.set(60, 90, 50);
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
      fillLight.position.set(-60, 50, -40);
      scene.add(fillLight);



      // 5. Building Group
      const buildingGroup = new THREE.Group();
      scene.add(buildingGroup);
      buildingGroupRef.current = buildingGroup;

      floorMeshesRef.current = [];

      // --- Materials (Building edges in var(--color-primary)) ---
      const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xeff6ff,
        metalness: 0.1,
        roughness: 0.25,
        transparent: true,
        opacity: 0.6,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });

      // Toàn bộ nét liền, không nét đứt, màu var(--color-primary) (#2563eb)
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x2563eb,
        linewidth: 2,
        depthTest: true
      });



      const coreShaftMaterial = new THREE.MeshBasicMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.4,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });

      // --- Central Elevator & Utility Riser ---
      const coreGeo = new THREE.BoxGeometry(6, 68, 6);
      const coreMesh = new THREE.Mesh(coreGeo, coreShaftMaterial);
      coreMesh.position.y = 34;
      buildingGroup.add(coreMesh);

      const coreEdges = new THREE.EdgesGeometry(coreGeo);
      const coreLine = new THREE.LineSegments(coreEdges, edgeMaterial);
      coreLine.position.y = 34;
      buildingGroup.add(coreLine);

      // --- High-rise Tower Tiers (32 Procedural Floors) - TOÀN BỘ NÉT LIỀN ---
      const tiers = [
        { startY: 0, count: 5, width: 22, depth: 22, heightPerFloor: 2.2, tag: 'base' },
        { startY: 11, count: 12, width: 18, depth: 18, heightPerFloor: 2.1, tag: 'mid_lower' },
        { startY: 36.2, count: 10, width: 14, depth: 14, heightPerFloor: 2.1, tag: 'mid_upper' },
        { startY: 57.2, count: 5, width: 10, depth: 10, heightPerFloor: 2.0, tag: 'rooftop' }
      ];

      let floorCounter = 1;
      tiers.forEach((tier) => {
        const tierHeight = tier.count * tier.heightPerFloor;
        const halfW = tier.width / 2;
        const halfD = tier.depth / 2;
        const yStart = tier.startY;
        const yEnd = tier.startY + tierHeight;

        // 1. Cột góc thẳng đứng nét liền toàn bộ khối tầng (Không bị ngắt quãng giữa các tầng)
        const cornerPoints = [
          new THREE.Vector3(-halfW, yStart, -halfD), new THREE.Vector3(-halfW, yEnd, -halfD),
          new THREE.Vector3(halfW, yStart, -halfD), new THREE.Vector3(halfW, yEnd, -halfD),
          new THREE.Vector3(halfW, yStart, halfD), new THREE.Vector3(halfW, yEnd, halfD),
          new THREE.Vector3(-halfW, yStart, halfD), new THREE.Vector3(-halfW, yEnd, halfD),
        ];
        const cornerGeo = new THREE.BufferGeometry().setFromPoints(cornerPoints);
        const cornerLines = new THREE.LineSegments(cornerGeo, edgeMaterial);
        buildingGroup.add(cornerLines);

        // 2. Từng tầng: khung viền ngang khép kín nét liền và khối kính
        for (let i = 0; i <= tier.count; i++) {
          const floorY = tier.startY + i * tier.heightPerFloor;

          // Đường viền ngang nét liền khép kín quanh chu vi sàn
          const ringPoints = [
            new THREE.Vector3(-halfW, floorY, -halfD),
            new THREE.Vector3(halfW, floorY, -halfD),
            new THREE.Vector3(halfW, floorY, halfD),
            new THREE.Vector3(-halfW, floorY, halfD),
            new THREE.Vector3(-halfW, floorY, -halfD)
          ];
          const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
          const ringLine = new THREE.Line(ringGeo, edgeMaterial);
          buildingGroup.add(ringLine);

          // Khối kính từng tầng
          if (i < tier.count) {
            const blockCenterY = floorY + tier.heightPerFloor / 2;
            const floorGeo = new THREE.BoxGeometry(tier.width - 0.08, tier.heightPerFloor, tier.depth - 0.08);
            const floorMesh = new THREE.Mesh(floorGeo, glassMaterial.clone());
            floorMesh.position.y = blockCenterY;
            floorMesh.userData = { floorNumber: floorCounter, tag: tier.tag };
            buildingGroup.add(floorMesh);
            floorMeshesRef.current.push(floorMesh);
            floorCounter++;
          }
        }
      });



      // --- Surrounding Context Low-Rise Buildings ---
      const contextPositions = [
        { x: -30, z: -25, w: 14, d: 14, h: 18 },
        { x: 30, z: -22, w: 12, d: 16, h: 22 },
        { x: -28, z: 24, w: 15, d: 12, h: 15 },
        { x: 26, z: 28, w: 12, d: 12, h: 26 },
        { x: 0, z: -35, w: 20, d: 10, h: 12 }
      ];

      const contextMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.05,
        roughness: 0.6,
        transparent: true,
        opacity: 0.85,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });

      const contextEdgeMat = new THREE.LineBasicMaterial({
        color: 0xcbd5e1,
        transparent: false,
        depthTest: true
      });

      contextPositions.forEach((pos) => {
        const geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
        const mesh = new THREE.Mesh(geo, contextMat);
        mesh.position.set(pos.x, pos.h / 2, pos.z);
        buildingGroup.add(mesh);

        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, contextEdgeMat);
        line.position.set(pos.x, pos.h / 2, pos.z);
        buildingGroup.add(line);
      });

      // --- Mouse Drag Interaction for Manual 3D Orbit ---
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };

      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        buildingGroup.rotation.y += deltaX * 0.008;
        camera.position.y = Math.max(20, Math.min(100, camera.position.y - deltaY * 0.2));
        camera.lookAt(0, 30, 0);

        previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      const domElement = renderer.domElement;
      domElement.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      // Touch events for Mobile
      let touchStartX = 0;
      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
        }
      };
      const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          const deltaX = e.touches[0].clientX - touchStartX;
          buildingGroup.rotation.y += deltaX * 0.006;
          touchStartX = e.touches[0].clientX;
        }
      };
      domElement.addEventListener('touchstart', onTouchStart, { passive: true });
      domElement.addEventListener('touchmove', onTouchMove, { passive: true });

      // Resize observer
      const handleResize = () => {
        if (!mountRef.current || !renderer) return;
        const newW = mountRef.current.clientWidth;
        const newH = mountRef.current.clientHeight || 560;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener('resize', handleResize);

      // 6. Animation Loop
      const animate = () => {
        animId = requestAnimationFrame(animate);

        // Auto rotate building group
        if (autoRotateRef.current && !isDragging) {
          buildingGroup.rotation.y += 0.0035;
        }



        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        domElement.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        domElement.removeEventListener('touchstart', onTouchStart);
        domElement.removeEventListener('touchmove', onTouchMove);
        if (renderer && renderer.domElement) {
          renderer.dispose();
        }
      };
    };

    if ((window as any).THREE) {
      const cleanup = initBuilding();
      return cleanup;
    } else {
      const interval = setInterval(() => {
        if ((window as any).THREE) {
          clearInterval(interval);
          initBuilding();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Highlight specific floors according to chosen subsystem
  useEffect(() => {
    if (!floorMeshesRef.current || floorMeshesRef.current.length === 0) return;

    floorMeshesRef.current.forEach((mesh) => {
      const tag = mesh.userData.tag;
      const num = mesh.userData.floorNumber;

      let isHighlight = false;
      let highlightColor = 0x2563eb;
      let emissiveColor = 0x1d4ed8;

      if (activeSubsystem === 'bms_software') {
        isHighlight = true;
        highlightColor = 0xdbeafe;
        emissiveColor = 0x2563eb;
      } else if (activeSubsystem === 'ddc_ip') {
        isHighlight = tag === 'rooftop' || tag === 'base';
        highlightColor = 0x0284c7;
        emissiveColor = 0x0369a1;
      } else if (activeSubsystem === 'ddc_mstp') {
        isHighlight = num >= 6 && num <= 26;
        highlightColor = 0x0d9488;
        emissiveColor = 0x0f766e;
      } else if (activeSubsystem === 'hvac_valves') {
        isHighlight = tag === 'base' || num >= 27;
        highlightColor = 0xf59e0b;
        emissiveColor = 0xd97706;
      } else if (activeSubsystem === 'sensors') {
        isHighlight = num % 2 === 0;
        highlightColor = 0x8b5cf6;
        emissiveColor = 0x7c3aed;
      } else if (activeSubsystem === 'actuators') {
        isHighlight = num % 3 === 0;
        highlightColor = 0x10b981;
        emissiveColor = 0x059669;
      }

      if (isHighlight) {
        mesh.material.color.setHex(highlightColor);
        mesh.material.emissive.setHex(emissiveColor);
        mesh.material.emissiveIntensity = activeSubsystem === 'bms_software' ? 0.12 : 0.45;
        mesh.material.opacity = activeSubsystem === 'bms_software' ? 0.7 : 0.85;
      } else {
        mesh.material.color.setHex(0xf8fafc);
        mesh.material.emissive.setHex(0x000000);
        mesh.material.emissiveIntensity = 0.0;
        mesh.material.opacity = 0.35;
      }
    });
  }, [activeSubsystem]);

  const selectedInfo = SUBSYSTEMS.find((s) => s.id === activeSubsystem) || SUBSYSTEMS[0];

  return (
    <div className="bms-building-frame">
      {/* Main 3D Canvas Container */}
      <div className="bms-canvas-wrapper">
        <div ref={mountRef} className="bms-three-canvas" />

        {/* 3D Drag Tip Overlay */}
        <div className="bms-drag-hint">
          <span>Kéo chuột để xoay 360° toà nhà</span>
        </div>

        {/* Left Subsystems Selector Tabs */}
        <div className="bms-subsystems-panel">
          {SUBSYSTEMS.map((sub) => {
            const isActive = sub.id === activeSubsystem;
            return (
              <button
                key={sub.id}
                type="button"
                className={`subsystem-tab-btn ${isActive ? 'active' : ''}`}
                style={{
                  borderLeftColor: isActive ? sub.color : 'transparent'
                }}
                onClick={() => setActiveSubsystem(sub.id)}
              >
                <div className="tab-icon-wrap" style={{ color: sub.color }}>
                  {sub.id === 'bms_software' && <Monitor size={17} />}
                  {sub.id === 'ddc_ip' && <Cpu size={17} />}
                  {sub.id === 'ddc_mstp' && <Thermometer size={17} />}
                  {sub.id === 'hvac_valves' && <Gauge size={17} />}
                  {sub.id === 'sensors' && <Activity size={17} />}
                  {sub.id === 'actuators' && <Wind size={17} />}
                </div>
                <div className="tab-text-wrap">
                  <span className="tab-name">{sub.name}</span>
                  <span className="tab-subtext">{sub.badge}</span>
                </div>
                <ChevronRight size={14} className="tab-chevron" />
              </button>
            );
          })}
        </div>

        {/* Bottom Right Live Telemetry Card */}
        <div className="bms-telemetry-floating-card">
          <div className="telemetry-card-header">
            <div className="telemetry-tag" style={{ background: `${selectedInfo.color}18`, color: selectedInfo.color }}>
              {selectedInfo.name}
            </div>
            <span className="telemetry-floor-badge">{selectedInfo.floorRange}</span>
          </div>

          <p className="telemetry-desc">{selectedInfo.description}</p>

          {selectedInfo.features && selectedInfo.features.length > 0 && (
            <div className="telemetry-features-list">
              {selectedInfo.features.map((feat, idx) => (
                <div key={idx} className="telemetry-feature-item">
                  <span className="feature-check-bullet" style={{ color: selectedInfo.color }}>
                    <Check size={13} strokeWidth={2.8} />
                  </span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
