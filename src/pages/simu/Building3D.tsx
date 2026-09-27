import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, ZoomIn, ZoomOut, Compass, Play, Pause } from 'lucide-react';

export const Building3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  // References to keep animation and interaction state
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const rotVelocityRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.25, y: -0.6 });
  const currentRotationRef = useRef({ x: 0.25, y: -0.6 });
  const targetZoomRef = useRef(22);
  const autoRotateRef = useRef(true);
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const floorGroupsRef = useRef<THREE.Group[]>([]);

  // Sync autoRotate state with ref
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101f); // Sleek tech dark slate background

    // 2. Camera setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, targetZoomRef.current);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight1.position.set(20, 30, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x22c55e, 1.2);
    dirLight2.position.set(-20, -10, -20);
    scene.add(dirLight2);

    // 5. Grid helper (ground floor)
    const grid = new THREE.GridHelper(28, 28, 0x22c55e, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    // 6. Master building group
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    buildingGroupRef.current = buildingGroup;

    // Materials
    const floorSlabMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });

    const floorEdgesMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
    });

    const columnMat = new THREE.LineBasicMaterial({
      color: 0x22c55e,
      linewidth: 2,
    });

    const glassPanelMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });

    const windowMullionMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
    });

    const accentGreenMat = new THREE.LineBasicMaterial({
      color: 0x4ade80,
      linewidth: 3,
    });

    // Helper: create wireframe box
    const createWireframeBox = (w: number, h: number, d: number, lineMat: THREE.LineBasicMaterial, faceMat?: THREE.Material) => {
      const group = new THREE.Group();
      const geom = new THREE.BoxGeometry(w, h, d);
      const edges = new THREE.EdgesGeometry(geom);
      const wireframe = new THREE.LineSegments(edges, lineMat);
      group.add(wireframe);

      if (faceMat) {
        const mesh = new THREE.Mesh(geom, faceMat);
        group.add(mesh);
      }
      return group;
    };

    // Building Dimensions
    const bWidth = 10;
    const bDepth = 7;
    const floorHeight = 3.2;
    const slabHeight = 0.25;

    const floorGroups: THREE.Group[] = [];

    // Construct 3 Floors
    for (let floor = 0; floor < 3; floor++) {
      const floorGroup = new THREE.Group();
      const floorBaseY = floor * floorHeight;

      // A. Floor Slab (Bottom of this floor)
      const slab = createWireframeBox(bWidth + 0.4, slabHeight, bDepth + 0.4, floorEdgesMat, floorSlabMat);
      slab.position.set(0, floorBaseY + slabHeight / 2, 0);
      floorGroup.add(slab);

      // B. Main perimeter glass walls with wireframe
      const wallH = floorHeight - slabHeight;
      const wallBox = createWireframeBox(bWidth, wallH, bDepth, floorEdgesMat, glassPanelMat);
      wallBox.position.set(0, floorBaseY + slabHeight + wallH / 2, 0);
      floorGroup.add(wallBox);

      // C. Structural Columns (8 perimeter columns)
      const colWidth = 0.35;
      const colH = wallH;
      const colX = (bWidth / 2) - 0.3;
      const colZ = (bDepth / 2) - 0.3;

      const columnPositions = [
        [-colX, -colZ],
        [0, -colZ],
        [colX, -colZ],
        [-colX, colZ],
        [0, colZ],
        [colX, colZ],
        [-colX, 0],
        [colX, 0],
      ];

      columnPositions.forEach(([cx, cz]) => {
        const column = createWireframeBox(colWidth, colH, colWidth, columnMat);
        column.position.set(cx, floorBaseY + slabHeight + colH / 2, cz);
        floorGroup.add(column);
      });

      // D. Window Mullions (vertical & horizontal subdividers)
      // Front and Back facade divisions
      const numDivX = 4;
      const stepX = bWidth / numDivX;
      for (let i = 1; i < numDivX; i++) {
        const xPos = -bWidth / 2 + i * stepX;
        // Front mullion line
        const frontPoints = [
          new THREE.Vector3(xPos, floorBaseY + slabHeight, bDepth / 2),
          new THREE.Vector3(xPos, floorBaseY + floorHeight, bDepth / 2),
        ];
        const frontGeom = new THREE.BufferGeometry().setFromPoints(frontPoints);
        floorGroup.add(new THREE.Line(frontGeom, windowMullionMat));

        // Back mullion line
        const backPoints = [
          new THREE.Vector3(xPos, floorBaseY + slabHeight, -bDepth / 2),
          new THREE.Vector3(xPos, floorBaseY + floorHeight, -bDepth / 2),
        ];
        const backGeom = new THREE.BufferGeometry().setFromPoints(backPoints);
        floorGroup.add(new THREE.Line(backGeom, windowMullionMat));
      }

      // Left and Right facade divisions
      const numDivZ = 3;
      const stepZ = bDepth / numDivZ;
      for (let j = 1; j < numDivZ; j++) {
        const zPos = -bDepth / 2 + j * stepZ;
        const leftPoints = [
          new THREE.Vector3(-bWidth / 2, floorBaseY + slabHeight, zPos),
          new THREE.Vector3(-bWidth / 2, floorBaseY + floorHeight, zPos),
        ];
        floorGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftPoints), windowMullionMat));

        const rightPoints = [
          new THREE.Vector3(bWidth / 2, floorBaseY + slabHeight, zPos),
          new THREE.Vector3(bWidth / 2, floorBaseY + floorHeight, zPos),
        ];
        floorGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightPoints), windowMullionMat));
      }

      // Horizontal mid-transom line
      const midY = floorBaseY + slabHeight + wallH * 0.55;
      const transomFront = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-bWidth / 2, midY, bDepth / 2),
        new THREE.Vector3(bWidth / 2, midY, bDepth / 2),
      ]);
      floorGroup.add(new THREE.Line(transomFront, windowMullionMat));

      const transomBack = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-bWidth / 2, midY, -bDepth / 2),
        new THREE.Vector3(bWidth / 2, midY, -bDepth / 2),
      ]);
      floorGroup.add(new THREE.Line(transomBack, windowMullionMat));

      // Floor-specific highlights:
      if (floor === 0) {
        // Tầng 1: Main entrance double glass door wireframe
        const doorW = 2.4;
        const doorH = 2.2;
        const doorBox = createWireframeBox(doorW, doorH, 0.1, accentGreenMat);
        doorBox.position.set(0, floorBaseY + slabHeight + doorH / 2, bDepth / 2 + 0.05);
        floorGroup.add(doorBox);

        // Entrance Canopy wireframe
        const canopy = createWireframeBox(3.4, 0.15, 1.8, floorEdgesMat, glassPanelMat);
        canopy.position.set(0, floorBaseY + slabHeight + doorH + 0.1, bDepth / 2 + 0.9);
        floorGroup.add(canopy);
      }

      if (floor === 1) {
        // Tầng 2: Office partition wireframe
        const partition = createWireframeBox(0.1, wallH * 0.8, bDepth * 0.7, windowMullionMat);
        partition.position.set(-1, floorBaseY + slabHeight + (wallH * 0.8) / 2, 0);
        floorGroup.add(partition);
      }

      if (floor === 2) {
        // Tầng 3: SCADA Center Control Desks wireframe
        const desk1 = createWireframeBox(2.2, 0.7, 1.0, accentGreenMat);
        desk1.position.set(0, floorBaseY + slabHeight + 0.35, 0);
        floorGroup.add(desk1);
      }

      buildingGroup.add(floorGroup);
      floorGroups.push(floorGroup);
    }

    floorGroupsRef.current = floorGroups;

    // 7. Rooftop & Technical Plant
    const roofY = 3 * floorHeight;
    // Roof slab
    const roofSlab = createWireframeBox(bWidth + 0.4, slabHeight, bDepth + 0.4, floorEdgesMat, floorSlabMat);
    roofSlab.position.set(0, roofY + slabHeight / 2, 0);
    buildingGroup.add(roofSlab);

    // Rooftop Parapet Railing
    const parapetH = 0.8;
    const parapet = createWireframeBox(bWidth + 0.2, parapetH, bDepth + 0.2, floorEdgesMat);
    parapet.position.set(0, roofY + slabHeight + parapetH / 2, 0);
    buildingGroup.add(parapet);

    // Elevator / Technical Room on roof
    const techRoomW = 3.6;
    const techRoomH = 1.8;
    const techRoomD = 3.2;
    const techRoom = createWireframeBox(techRoomW, techRoomH, techRoomD, floorEdgesMat, glassPanelMat);
    techRoom.position.set(-1.8, roofY + slabHeight + techRoomH / 2, 0);
    buildingGroup.add(techRoom);

    // Rooftop HVAC Chiller Unit Wireframe
    const chillerW = 2.4;
    const chillerH = 1.2;
    const chillerD = 1.6;
    const chillerUnit = createWireframeBox(chillerW, chillerH, chillerD, accentGreenMat);
    chillerUnit.position.set(2.2, roofY + slabHeight + chillerH / 2, 0.8);
    buildingGroup.add(chillerUnit);

    // Rooftop Solar Panel Frames (green wireframe)
    for (let s = 0; s < 2; s++) {
      const panel = createWireframeBox(2.0, 0.08, 1.4, accentGreenMat, floorSlabMat);
      panel.position.set(2.2, roofY + slabHeight + 0.4, -1.5 + s * 1.8);
      panel.rotation.x = -0.25;
      buildingGroup.add(panel);
    }

    // Centering the building vertically
    buildingGroup.position.y = -roofY / 2;

    // 8. Event listeners for mouse/touch rotation & wheel zoom
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevMousePosRef.current.x;
      const deltaY = e.clientY - prevMousePosRef.current.y;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };

      rotVelocityRef.current.y = deltaX * 0.005;
      rotVelocityRef.current.x = deltaY * 0.005;

      targetRotationRef.current.y += deltaX * 0.006;
      targetRotationRef.current.x += deltaY * 0.006;

      // Clamp vertical tilt so it doesn't flip upside down
      targetRotationRef.current.x = Math.max(-0.6, Math.min(1.0, targetRotationRef.current.x));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetZoomRef.current += e.deltaY * 0.02;
      // Clamp zoom distance between 12 and 36
      targetZoomRef.current = Math.max(12, Math.min(36, targetZoomRef.current));
    };

    // Mobile Touch Support
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMousePosRef.current.x;
      const deltaY = e.touches[0].clientY - prevMousePosRef.current.y;
      prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      targetRotationRef.current.y += deltaX * 0.008;
      targetRotationRef.current.x += deltaY * 0.008;
      targetRotationRef.current.x = Math.max(-0.6, Math.min(1.0, targetRotationRef.current.x));
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });
    domElem.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 10. Animation Loop with smooth damping
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotateRef.current && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.004;
      }

      // Smooth interpolation for rotation
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

      buildingGroup.rotation.x = currentRotationRef.current.x;
      buildingGroup.rotation.y = currentRotationRef.current.y;

      // Smooth interpolation for camera zoom
      camera.position.z += (targetZoomRef.current - camera.position.z) * 0.08;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      domElem.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElem.removeEventListener('wheel', handleWheel);
      domElem.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (container.contains(domElem)) {
        container.removeChild(domElem);
      }
      renderer.dispose();
    };
  }, []);

  // Floor Selection effect
  useEffect(() => {
    floorGroupsRef.current.forEach((fg, idx) => {
      if (selectedFloor === null) {
        fg.position.y = 0;
      } else if (idx === selectedFloor) {
        fg.position.y = 0.5; // elevate selected floor
      } else {
        fg.position.y = 0;
      }
    });
  }, [selectedFloor]);

  const handleResetView = () => {
    targetRotationRef.current = { x: 0.25, y: -0.6 };
    targetZoomRef.current = 22;
  };

  const handleZoom = (delta: number) => {
    targetZoomRef.current = Math.max(12, Math.min(36, targetZoomRef.current + delta));
  };

  return (
    <div className="simu-3d-container">
      {/* 3D Canvas Mounting Area */}
      <div className="simu-3d-canvas-wrap" ref={mountRef}>
        {/* Floating Controls Overlay */}
        <div className="simu-3d-overlay-top">
          <div className="simu-3d-badge">
            <span className="dot-pulse"></span>
            <span>MÔ HÌNH 3D WIREFRAME TOÀ NHÀ 3 TẦNG (SCADA / BMS)</span>
          </div>

          <div className="simu-3d-hint">
            <Compass size={14} />
            <span>Kéo chuột để xoay 360° • Cuộn chuột để thu phóng</span>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="simu-3d-toolbar">
          <button
            type="button"
            className={`simu-tool-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Tạm dừng tự xoay' : 'Bật tự động xoay'}
          >
            {autoRotate ? <Pause size={16} /> : <Play size={16} />}
            <span>{autoRotate ? 'Dừng xoay' : 'Tự xoay'}</span>
          </button>

          <button
            type="button"
            className="simu-tool-btn"
            onClick={handleResetView}
            title="Đặt lại góc nhìn chuẩn"
          >
            <RotateCw size={16} />
            <span>Góc chuẩn</span>
          </button>

          <button
            type="button"
            className="simu-tool-btn"
            onClick={() => handleZoom(-3)}
            title="Phóng to"
          >
            <ZoomIn size={16} />
          </button>

          <button
            type="button"
            className="simu-tool-btn"
            onClick={() => handleZoom(3)}
            title="Thu nhỏ"
          >
            <ZoomOut size={16} />
          </button>
        </div>

        {/* Floor Quick Navigation Selector */}
        <div className="simu-3d-floors-panel">
          <div className="floor-nav-title">Cấu trúc 3 tầng:</div>
          <button
            type="button"
            className={`floor-btn ${selectedFloor === 2 ? 'active' : ''}`}
            onClick={() => setSelectedFloor(selectedFloor === 2 ? null : 2)}
          >
            <span className="floor-tag">TẦNG 3</span>
            <span className="floor-name">Trung tâm Điều hành BMS</span>
          </button>
          <button
            type="button"
            className={`floor-btn ${selectedFloor === 1 ? 'active' : ''}`}
            onClick={() => setSelectedFloor(selectedFloor === 1 ? null : 1)}
          >
            <span className="floor-tag">TẦNG 2</span>
            <span className="floor-name">Văn phòng Thông minh</span>
          </button>
          <button
            type="button"
            className={`floor-btn ${selectedFloor === 0 ? 'active' : ''}`}
            onClick={() => setSelectedFloor(selectedFloor === 0 ? null : 0)}
          >
            <span className="floor-tag">TẦNG 1</span>
            <span className="floor-name">Sảnh Lễ tân & Triển lãm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
