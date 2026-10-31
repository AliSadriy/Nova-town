import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';

export default function App() {
  const onContextCreate = async (gl: any) => {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    const renderer = new THREE.WebGLRenderer({
      context: gl,
      antialias: true,
    });
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(15, 20, 15);
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 0.9);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // Ground plane
    const gridHelper = new THREE.GridHelper(30, 30, 0x4ecca3, 0x232931);
    scene.add(gridHelper);

    // Test Building Box
    const geometry = new THREE.BoxGeometry(2, 4, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x3498db });
    const building = new THREE.Mesh(geometry, material);
    building.position.set(0, 2, 0);
    scene.add(building);

    let animationFrameId: number;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      building.rotation.y += 0.01;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏙️ NovaTown Android 3D</Text>
        <Text style={styles.subtitle}>Expo GL + Three.js Proof of Concept</Text>
      </View>

      <View style={styles.canvasContainer}>
        <GLView style={styles.glView} onContextCreate={onContextCreate} />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => console.log('Build action triggered')}>
          <Text style={styles.buttonText}>🏗️ Build Residential</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ecca3',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  glView: {
    flex: 1,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  button: {
    backgroundColor: '#4ecca3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
