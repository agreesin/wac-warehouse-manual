import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Three.js 기반 3D 컨테이너 & 파레트 시뮬레이션 뷰포트
 * - mode: 'container' (컨테이너 적재 뷰) | 'pallet' (개별 파레트 상세 뷰)
 */
export function ThreeViewport({
  mode = 'container',
  containerInstance = null,
  containerSpec = null,
  palletInstance = null,
  visibleStep = 100, // 0 ~ 100 (%)
  tierFilter = 'all', // 'all' | 'tier1' | 'tier2'
  showWireframeWall = true,
  explodeLayers = false,
  selectedCargoId = null,
  onSelectPallet = null,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const contentGroupRef = useRef(null);
  const pickableMeshesRef = useRef([]);

  const [hoveredInfo, setHoveredInfo] = useState(null);

  // Scale factor: 1mm = 0.001 units in Three.js (1 meter = 1 unit)
  const SCALE = 0.001;

  // Initialize Three.js Scene, Camera, Renderer, Controls
  useEffect(() => {
    const containerEl = mountRef.current;
    if (!containerEl) return;

    const width = containerEl.clientWidth || 800;
    const height = containerEl.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a');

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 200);
    camera.position.set(10, 6.5, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerEl.innerHTML = '';
    containerEl.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.minDistance = 0.8;
    controls.maxDistance = 45;
    controls.enableZoom = false; // 기본은 비활성화하여 페이지 상하 스크롤이 3D 뷰에 걸리지 않도록 방지

    let isCanvasFocused = false;
    const handlePointerDown = () => {
      isCanvasFocused = true;
      controls.enableZoom = true;
    };
    const handlePointerLeave = () => {
      isCanvasFocused = false;
      controls.enableZoom = false;
    };
    const handleWheel = (e) => {
      // Ctrl 키를 누르고 있거나 캔버스를 클릭한 경우에만 3D 줌 활성화
      if (e.ctrlKey || e.metaKey || isCanvasFocused) {
        controls.enableZoom = true;
      } else {
        controls.enableZoom = false;
      }
    };

    // Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.78);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight('#ffffff', 0.85);
    dirLight1.position.set(15, 25, 18);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight('#93c5fd', 0.4);
    dirLight2.position.set(-15, 12, -14);
    scene.add(dirLight2);

    // Subtle warehouse floor grid
    const gridHelper = new THREE.GridHelper(28, 28, '#334155', '#1e293b');
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const contentGroup = new THREE.Group();
    scene.add(contentGroup);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    contentGroupRef.current = contentGroup;

    // Raycaster for hover inspection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(pickableMeshesRef.current, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && hit.userData.info) {
          setHoveredInfo({
            ...hit.userData.info,
            screenX: e.clientX - rect.left,
            screenY: e.clientY - rect.top,
          });
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredInfo(null);
      renderer.domElement.style.cursor = 'grab';
    };

    const handleClick = (e) => {
      if (!onSelectPallet || mode !== 'container') return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(pickableMeshesRef.current, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.info?.palletIndex != null) {
          onSelectPallet(hit.userData.info.palletIndex - 1);
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: true });
    renderer.domElement.addEventListener('click', handleClick);

    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerEl) return;
      const w = containerEl.clientWidth || 800;
      const h = containerEl.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerEl);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, []);

  // Camera Preset Helper
  const setCameraView = (preset) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (mode === 'pallet') {
      controls.target.set(0, 0.8, 0);
      if (preset === 'iso') camera.position.set(2.4, 2.0, 2.4);
      else if (preset === 'front') camera.position.set(0, 0.9, 3.2);
      else if (preset === 'side') camera.position.set(3.2, 0.9, 0);
      else if (preset === 'top') camera.position.set(0, 3.8, 0.01);
    } else {
      const cLen = ((containerSpec?.length || 12032) * SCALE);
      const dist = Math.max(6.5, cLen * 1.05);
      controls.target.set(0, 1.1, 0);
      if (preset === 'iso') camera.position.set(dist * 0.85, dist * 0.55, dist * 0.85);
      else if (preset === 'front') camera.position.set(dist * 1.15, 1.3, 0); // Door side (X+)
      else if (preset === 'side') camera.position.set(0, 1.3, dist * 1.05);
      else if (preset === 'top') camera.position.set(0, dist * 1.25, 0.01);
    }
    controls.update();
  };

  // Adjust camera automatically when switching between container and pallet mode or changing container length
  useEffect(() => {
    if (mode === 'pallet') {
      setCameraView('iso');
    } else {
      setCameraView('iso');
    }
  }, [mode, containerSpec?.id]);

  // Build 3D Meshes whenever simulation data or filters change
  useEffect(() => {
    const contentGroup = contentGroupRef.current;
    if (!contentGroup) return;

    // Clear previous meshes & dispose WebGL geometries/materials to prevent GPU memory leaks
    const disposeObject3D = (obj) => {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m?.dispose && m.dispose());
        } else if (obj.material.dispose) {
          obj.material.dispose();
        }
      }
      if (obj.children && obj.children.length > 0) {
        for (const child of obj.children) {
          disposeObject3D(child);
        }
      }
    };

    while (contentGroup.children.length > 0) {
      const child = contentGroup.children[0];
      contentGroup.remove(child);
      disposeObject3D(child);
    }
    pickableMeshesRef.current = [];

    // Helper: create wooden pallet mesh at local origin (0..pLen along X, 0..baseH along Y, 0..pWid along Z)
    const createPalletBaseGroup = (pLenMm, baseHMm, pWidMm, tier = 1) => {
      const pGroup = new THREE.Group();
      const pL = pLenMm * SCALE;
      const pH = Math.max(40, baseHMm) * SCALE;
      const pW = pWidMm * SCALE;

      const woodColor = tier === 2 ? '#d97706' : '#b45309';
      const woodMat = new THREE.MeshStandardMaterial({
        color: woodColor,
        roughness: 0.8,
        metalness: 0.05,
      });

      // Top deck boards (5 slats along X)
      const slatCount = 5;
      const slatThickness = pH * 0.22;
      const slatWidth = (pW / slatCount) * 0.78;
      for (let i = 0; i < slatCount; i++) {
        const zPos =
          slatWidth / 2 + (i * (pW - slatWidth)) / Math.max(1, slatCount - 1);
        const slatGeo = new THREE.BoxGeometry(pL, slatThickness, slatWidth);
        const slatMesh = new THREE.Mesh(slatGeo, woodMat);
        slatMesh.position.set(pL / 2, pH - slatThickness / 2, zPos);
        pGroup.add(slatMesh);
      }

      // 3 longitudinal stringers/runners
      const runnerH = pH - slatThickness;
      const runnerW = Math.min(0.09, pW * 0.08);
      const zPositions = [runnerW / 2, pW / 2, pW - runnerW / 2];
      for (const zPos of zPositions) {
        const runGeo = new THREE.BoxGeometry(pL, runnerH, runnerW);
        const runMesh = new THREE.Mesh(runGeo, woodMat);
        runMesh.position.set(pL / 2, runnerH / 2, zPos);
        pGroup.add(runMesh);
      }

      // Outline edge of pallet base
      const fullBaseGeo = new THREE.BoxGeometry(pL, pH, pW);
      const edgeGeo = new THREE.EdgesGeometry(fullBaseGeo);
      const edgeMat = new THREE.LineBasicMaterial({ color: '#78350f' });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeLines.position.set(pL / 2, pH / 2, pW / 2);
      pGroup.add(edgeLines);

      return pGroup;
    };

    // Shared edge material
    const boxEdgeMat = new THREE.LineBasicMaterial({
      color: '#0f172a',
      transparent: true,
      opacity: 0.55,
    });

    if (mode === 'container' && containerSpec) {
      const cL = containerSpec.length * SCALE;
      const cW = containerSpec.width * SCALE;
      const cH = containerSpec.height * SCALE;

      // Center container around world origin (X: -cL/2 .. +cL/2, Y: 0 .. cH, Z: -cW/2 .. +cW/2)
      const originX = -cL / 2;
      const originZ = -cW / 2;

      // 1. Container Floor
      const floorGeo = new THREE.BoxGeometry(cL, 0.04, cW);
      const floorMat = new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.85,
        metalness: 0.15,
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(0, -0.02, 0);
      contentGroup.add(floorMesh);

      // 2. Container Walls / Wireframe
      const containerBoxGeo = new THREE.BoxGeometry(cL, cH, cW);
      if (showWireframeWall) {
        const wallMat = new THREE.MeshStandardMaterial({
          color: '#38bdf8',
          transparent: true,
          opacity: 0.07,
          depthWrite: false,
          side: THREE.BackSide,
        });
        const wallMesh = new THREE.Mesh(containerBoxGeo, wallMat);
        wallMesh.position.set(0, cH / 2, 0);
        contentGroup.add(wallMesh);
      }

      const containerEdges = new THREE.EdgesGeometry(containerBoxGeo);
      const containerLineMat = new THREE.LineBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.75,
      });
      const containerWireframe = new THREE.LineSegments(containerEdges, containerLineMat);
      containerWireframe.position.set(0, cH / 2, 0);
      contentGroup.add(containerWireframe);

      // Door End Frame Highlight (at X = +cL/2)
      const doorFrameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(cW, cH));
      const doorFrameMat = new THREE.LineBasicMaterial({ color: '#f59e0b' });
      const doorFrame = new THREE.LineSegments(doorFrameGeo, doorFrameMat);
      doorFrame.rotation.y = Math.PI / 2;
      doorFrame.position.set(cL / 2 + 0.005, cH / 2, 0);
      contentGroup.add(doorFrame);

      // 3. Render Placed Pallets inside Container
      const placedList = containerInstance?.placedPallets || [];
      const maxVisibleCount = Math.ceil((placedList.length * visibleStep) / 100);

      placedList.slice(0, maxVisibleCount).forEach((placed, idx) => {
        if (tierFilter === 'tier1' && placed.tier !== 1) return;
        if (tierFilter === 'tier2' && placed.tier !== 2) return;

        const { pallet, x, y, z, rotated, tier } = placed;
        const pGroup = new THREE.Group();

        const pWorldX = originX + x * SCALE;
        const pWorldY = y * SCALE;
        const pWorldZ = originZ + z * SCALE;
        pGroup.position.set(pWorldX, pWorldY, pWorldZ);

        // Pallet wooden base
        const baseMeshGroup = createPalletBaseGroup(
          placed.length,
          pallet.baseHeight,
          placed.width,
          tier
        );
        pGroup.add(baseMeshGroup);

        // Render boxes on this pallet
        // box.x is along pallet.width, box.z is along pallet.length.
        // In container space, placed.length is along X and placed.width is along Z.
        const swapXZ = placed.length !== pallet.width;
        for (const box of pallet.boxes) {
          const bx = swapXZ ? box.z : box.x;
          const bz = swapXZ ? box.x : box.z;
          const bw = swapXZ ? box.l : box.w;
          const bl = swapXZ ? box.w : box.l;
          const bh = box.h;

          const boxGeo = new THREE.BoxGeometry(bw * SCALE, bh * SCALE, bl * SCALE);
          const isDimmed = selectedCargoId && box.cargoId !== selectedCargoId;
          const boxMat = new THREE.MeshStandardMaterial({
            color: box.color || '#3b82f6',
            roughness: 0.45,
            metalness: 0.08,
            transparent: Boolean(isDimmed),
            opacity: isDimmed ? 0.18 : 1,
          });

          const boxMesh = new THREE.Mesh(boxGeo, boxMat);
          const layerGap = explodeLayers ? (box.layerIndex || 0) * 0.04 : 0;

          boxMesh.position.set(
            (bx + bw / 2) * SCALE,
            (box.y + bh / 2) * SCALE + layerGap,
            (bz + bl / 2) * SCALE
          );

          boxMesh.userData = {
            info: {
              type: 'pallet-box',
              palletIndex: pallet.index,
              tier,
              boxName: box.name,
              boxDim: `${box.w} × ${box.l} × ${box.h} mm`,
              palletDim: `${pallet.width} × ${pallet.length} × ${pallet.totalHeight} mm`,
              palletBoxCount: pallet.boxes.length,
              palletWeight: `${pallet.totalWeight} kg`,
            },
          };

          pickableMeshesRef.current.push(boxMesh);
          pGroup.add(boxMesh);

          const edges = new THREE.EdgesGeometry(boxGeo);
          const line = new THREE.LineSegments(edges, boxEdgeMat);
          line.position.copy(boxMesh.position);
          pGroup.add(line);
        }

        contentGroup.add(pGroup);
      });

      // 4. Render 3D Center of Gravity (CoG) Marker inside Container
      if (containerInstance?.cog) {
        const { cogX, cogY, cogZ } = containerInstance.cog;
        const cx = originX + cogX * SCALE;
        const cy = cogY * SCALE;
        const cz = originZ + cogZ * SCALE;

        const cogGroup = new THREE.Group();

        // Glowing CoG Sphere
        const sphereGeo = new THREE.SphereGeometry(0.16, 24, 24);
        const sphereMat = new THREE.MeshBasicMaterial({
          color: '#facc15',
        });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        sphereMesh.position.set(cx, cy, cz);
        cogGroup.add(sphereMesh);

        // Outer ring halo
        const ringGeo = new THREE.RingGeometry(0.22, 0.28, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: '#ef4444',
          side: THREE.DoubleSide,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.set(cx, 0.02, cz);
        cogGroup.add(ringMesh);

        // Vertical drop line from CoG to container floor
        const lineMat = new THREE.LineBasicMaterial({ color: '#facc15' });
        const vPoints = [new THREE.Vector3(cx, 0, cz), new THREE.Vector3(cx, cy + 0.4, cz)];
        const vGeo = new THREE.BufferGeometry().setFromPoints(vPoints);
        cogGroup.add(new THREE.Line(vGeo, lineMat));

        contentGroup.add(cogGroup);
      }
    } else if (mode === 'pallet' && palletInstance) {
      // Single Pallet Detailed 3D View
      const pW = palletInstance.width * SCALE;
      const pL = palletInstance.length * SCALE;
      const originX = -pW / 2;
      const originZ = -pL / 2;

      const pGroup = new THREE.Group();
      pGroup.position.set(originX, 0, originZ);

      // Base
      const baseMeshGroup = createPalletBaseGroup(
        palletInstance.width,
        palletInstance.baseHeight,
        palletInstance.length,
        1
      );
      pGroup.add(baseMeshGroup);

      // Max Allowed Height Wireframe Guide
      const maxH = palletInstance.maxTotalHeight * SCALE;
      const guideGeo = new THREE.BoxGeometry(pW, maxH, pL);
      const guideEdges = new THREE.EdgesGeometry(guideGeo);
      const guideLineMat = new THREE.LineBasicMaterial({
        color: '#64748b',
        transparent: true,
        opacity: 0.45,
      });
      const guideLines = new THREE.LineSegments(guideEdges, guideLineMat);
      guideLines.position.set(pW / 2, maxH / 2, pL / 2);
      pGroup.add(guideLines);

      // Visible boxes based on visibleStep slider
      const totalBoxes = palletInstance.boxes.length;
      const maxBoxIdx = Math.ceil((totalBoxes * visibleStep) / 100);

      palletInstance.boxes.slice(0, maxBoxIdx).forEach((box, idx) => {
        const bw = box.w * SCALE;
        const bh = box.h * SCALE;
        const bl = box.l * SCALE;

        const boxGeo = new THREE.BoxGeometry(bw, bh, bl);
        const isDimmed = selectedCargoId && box.cargoId !== selectedCargoId;
        const boxMat = new THREE.MeshStandardMaterial({
          color: box.color || '#3b82f6',
          roughness: 0.4,
          metalness: 0.1,
          transparent: Boolean(isDimmed),
          opacity: isDimmed ? 0.18 : 1,
        });

        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        const layerGap = explodeLayers ? (box.layerIndex || 0) * 0.06 : 0;

        boxMesh.position.set(
          box.x * SCALE + bw / 2,
          box.y * SCALE + bh / 2 + layerGap,
          box.z * SCALE + bl / 2
        );

        boxMesh.userData = {
          info: {
            type: 'single-box',
            palletIndex: palletInstance.index,
            layerIndex: (box.layerIndex || 0) + 1,
            boxName: box.name,
            boxDim: `${box.w} × ${box.l} × ${box.h} mm ${box.rotated ? '(90° 회전)' : ''}`,
            palletDim: `${palletInstance.width} × ${palletInstance.length} × ${palletInstance.totalHeight} mm`,
            palletBoxCount: palletInstance.boxes.length,
            palletWeight: `${palletInstance.totalWeight} kg`,
          },
        };

        pickableMeshesRef.current.push(boxMesh);
        pGroup.add(boxMesh);

        const edges = new THREE.EdgesGeometry(boxGeo);
        const line = new THREE.LineSegments(edges, boxEdgeMat);
        line.position.copy(boxMesh.position);
        pGroup.add(line);
      });

      contentGroup.add(pGroup);
    }
  }, [
    mode,
    containerInstance,
    containerSpec,
    palletInstance,
    visibleStep,
    tierFilter,
    showWireframeWall,
    explodeLayers,
    selectedCargoId,
  ]);

  return (
    <div className="cbm-viewport-wrapper">
      <div ref={mountRef} className="cbm-three-canvas" />

      {/* Camera Preset Toolbar Overlay */}
      <div className="cbm-camera-toolbar">
        <button type="button" onClick={() => setCameraView('iso')} title="기본 3D 등각 뷰">
          <span className="cam-label">3D 등각</span>
        </button>
        <button type="button" onClick={() => setCameraView('front')} title="정면(도어) 뷰">
          <span className="cam-label">정면 (도어)</span>
        </button>
        <button type="button" onClick={() => setCameraView('side')} title="측면 뷰">
          <span className="cam-label">측면 (Side)</span>
        </button>
        <button type="button" onClick={() => setCameraView('top')} title="위에서 내려다본 평면 뷰">
          <span className="cam-label">평면 (Top)</span>
        </button>
      </div>

      {/* Direction Legend Overlay */}
      <div className="cbm-viewport-legend">
        {mode === 'container' ? (
          <>
            <span className="cbm-legend-desktop">
              마우스 드래그: 360° 회전 | 클릭 후 휠/Ctrl+휠: 확대·축소 | 우클릭: 이동 |{' '}
              <strong style={{ color: '#f59e0b' }}>주황색 테두리: 컨테이너 문(Door)</strong> | 파레트 클릭 시 상세 보기
            </span>
            <span className="cbm-legend-mobile">
              드래그: 3D 회전 · 2손가락: 줌 · <strong style={{ color: '#f59e0b' }}>주황: 도어</strong> · 파레트 터치 시 상세 보기
            </span>
          </>
        ) : (
          <>
            <span className="cbm-legend-desktop">
              마우스 드래그: 360° 회전 | 클릭 후 휠/Ctrl+휠: 확대·축소 | 회색 외곽선: 최대 허용 높이({palletInstance?.maxTotalHeight || 1800}mm) 가이드
            </span>
            <span className="cbm-legend-mobile">
              드래그: 3D 회전 · 2손가락: 줌 · 회색선: 최대 허용 높이({palletInstance?.maxTotalHeight || 1800}mm) 가이드
            </span>
          </>
        )}
      </div>

      {/* Hover/Touch Tooltip HUD */}
      {hoveredInfo && (
        <div
          className="cbm-hover-tooltip"
          style={{
            left: Math.min(hoveredInfo.screenX + 16, window.innerWidth > 640 ? 520 : window.innerWidth - 240),
            top: Math.max(hoveredInfo.screenY - 10, 12),
          }}
        >
          <div className="cbm-hover-title">
            <span>Pallet #{hoveredInfo.palletIndex}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {hoveredInfo.tier && (
                <span className={`cbm-tier-badge tier-${hoveredInfo.tier}`}>
                  {hoveredInfo.tier}단 적재
                </span>
              )}
              {hoveredInfo.layerIndex && (
                <span className="cbm-tier-badge tier-1">{hoveredInfo.layerIndex}층(단)</span>
              )}
              <button
                type="button"
                className="cbm-tooltip-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setHoveredInfo(null);
                }}
                aria-label="툴팁 닫기"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="cbm-hover-row">
            <span>화물명:</span>
            <strong>{hoveredInfo.boxName}</strong>
          </div>
          <div className="cbm-hover-row">
            <span>박스 치수:</span>
            <strong>{hoveredInfo.boxDim}</strong>
          </div>
          <div className="cbm-hover-row">
            <span>파레트 규격:</span>
            <strong>{hoveredInfo.palletDim}</strong>
          </div>
          <div className="cbm-hover-row">
            <span>파레트 적재량:</span>
            <strong>
              {hoveredInfo.palletBoxCount}박스 ({hoveredInfo.palletWeight})
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
