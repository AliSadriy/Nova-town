import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();
const screenshotsDir = join(projectRoot, 'screenshots');

// Initialize screenshots directory
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

export class NovaTownDriver {
  constructor() {
    this.processes = new Map();
    this.isRunning = false;
    this.healthStatus = {
      api: false,
      web: false,
      telegram: false,
      android: false,
    };
  }

  async startAll() {
    console.log('=== Starting NovaTown All Platforms ===');

    // Start API server
    console.log('Starting NovaTown API server...');
    const apiProcess = spawn('pnpm', ['--filter', '@nova-town/api', 'dev'], {
      cwd: projectRoot,
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });
    this.processes.set('api', apiProcess);
    this.captureProcessOutput(apiProcess, 'API');

    // Start web application
    console.log('Starting NovaTown Web application...');
    const webProcess = spawn('pnpm', ['--filter', '@nova-town/web', 'dev'], {
      cwd: projectRoot,
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });
    this.processes.set('web', webProcess);
    this.captureProcessOutput(webProcess, 'WEB');

    // Start Telegram Mini App
    console.log('Starting NovaTown Telegram Mini App...');
    const telegramProcess = spawn('pnpm', ['--filter', '@nova-town/telegram', 'dev'], {
      cwd: projectRoot,
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });
    this.processes.set('telegram', telegramProcess);
    this.captureProcessOutput(telegramProcess, 'TELEGRAM');

    // Start Android application (Expo)
    console.log('Starting NovaTown Android application...');
    const androidProcess = spawn('pnpm', ['--filter', '@nova-town/android', 'start'], {
      cwd: projectRoot,
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });
    this.processes.set('android', androidProcess);
    this.captureProcessOutput(androidProcess, 'ANDROID');

    // Wait for services to initialize
    console.log('Waiting for services to initialize...');
    await this.waitForServices();

    // Store PIDs for management
    this.processes.forEach((process, name) => {
      if (process.pid) {
        console.log(`${name} started with PID: ${process.pid}`);
      }
    });

    this.isRunning = true;
    console.log('\n=== NovaTown is running! ===');
    console.log('Web: http://localhost:3000');
    console.log('Telegram: http://localhost:3000 (same codebase)');
    console.log('Android: Running on Expo (Android Studio required for native)');
    console.log('API: http://localhost:4000/api/city/default');
    console.log('\nPress Ctrl+C to stop all services');
  }

  private captureProcessOutput(process, name) {
    process.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('error') || output.includes('Error')) {
        console.error(`[${name}] ERROR:`, output);
      } else {
        console.log(`[${name}]`, output.trim());
      }
    });

    process.stderr.on('data', (data) => {
      console.error(`[${name}] STDERR:`, data.toString());
    });

    process.on('exit', (code, signal) => {
      console.log(`[${name}] Process exited with code ${code}, signal ${signal}`);
      this.processes.delete(name);
      if (this.isRunning && code !== 0 && code !== null) {
        console.log(`Warning: ${name} process exited unexpectedly`);
      }
    });
  }

  private async waitForServices(timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Check API health
        const apiHealthy = await this.checkAPIHealth();
        if (apiHealthy) this.healthStatus.api = true;

        // Check web accessibility (simplified check)
        const webHealthy = await this.checkWebHealth();
        if (webHealthy) this.healthStatus.web = true;

        // Check Telegram health
        const telegramHealthy = await this.checkTelegramHealth();
        if (telegramHealthy) this.healthStatus.telegram = true;

        // Check Android (Expo) health
        const androidHealthy = await this.checkAndroidHealth();
        if (androidHealthy) this.healthStatus.android = true;

        if (Object.values(this.healthStatus).some(status => status)) {
          console.log('✓ Services are initializing...');
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log('Service health check failed:', error.message);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!Object.values(this.healthStatus).some(status => status)) {
      console.log('Warning: Some services may not have started properly');
    }
  }

  private async checkAPIHealth() {
    try {
      const { execSync } = await import('child_process');
      const healthResponse = execSync('curl -s http://localhost:4000/health', { encoding: 'utf8' });
      const healthData = JSON.parse(healthResponse);
      return healthData.status === 'ok' && healthData.database === 'connected';
    } catch (error) {
      return false;
    }
  }

  private async checkWebHealth() {
    try {
      const { execSync } = await import('child_process');
      const response = execSync('curl -s http://localhost:3000', { encoding: 'utf8' });
      return response.includes('NovaTown');
    } catch (error) {
      return false;
    }
  }

  private async checkTelegramHealth() {
    try {
      const { execSync } = await import('child_process');
      const response = execSync('curl -s http://localhost:3000', { encoding: 'utf8' });
      return response.includes('NovaTown');
    } catch (error) {
      return false;
    }
  }

  private async checkAndroidHealth() {
    // Android Expo check (just verify Metro bundler is running)
    try {
      const { execSync } = await import('child_process');
      const response = execSync('curl -s http://localhost:8081', { encoding: 'utf8' });
      return response.includes('Metro');
    } catch (error) {
      return false;
    }
  }

  async buildAndSync() {
    console.log('=== Building and Syncing NovaTown ===');

    // Build all packages
    console.log('Building all packages...');
    try {
      execSync('pnpm run build', { cwd: projectRoot, stdio: 'pipe' });
      console.log('✓ All packages built successfully');
    } catch (error) {
      console.error('Build failed:', error.message);
      return false;
    }

    // Type check all packages
    console.log('Running TypeScript checks...');
    try {
      execSync('pnpm run typecheck', { cwd: projectRoot, stdio: 'pipe' });
      console.log('✓ TypeScript checks passed');
    } catch (error) {
      console.error('TypeScript checks failed:', error.message);
      return false;
    }

    // Initialize database if needed
    console.log('Setting up database...');
    try {
      execSync('pnpm --filter @nova-town/database prisma:generate', { cwd: projectRoot, stdio: 'pipe' });
      console.log('✓ Database client generated');
    } catch (error) {
      console.error('Database setup failed:', error.message);
    }

    return true;
  }

  async takeScreenshot(platform = 'web') {
    console.log(`=== Taking screenshot for ${platform} ===`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = join(screenshotsDir, `novatown-${platform}-${timestamp}.png`);

    try {
      const screenshotCommand = `curl -X POST "http://localhost:3000/api/screenshot" -H "Content-Type: application/json" -d '{\"path\":\"${screenshotPath}\"}'`;
      execSync(screenshotCommand, { stdio: 'pipe', timeout: 30000 });

      if (existsSync(screenshotPath)) {
        console.log(`✓ Screenshot saved to: ${screenshotPath}`);
        return screenshotPath;
      } else {
        console.log('⚠ Screenshot file not found');
        return null;
      }
    } catch (error) {
      console.error('Screenshot failed:', error.message);
      return null;
    }
  }

  async buildStructure(buildingType, gridX, gridY, cityId = 'test-city-id') {
    console.log(`=== Building ${buildingType} at (${gridX}, ${gridY}) ===`);

    const operationId = `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const payload = {
      cityId,
      operations: [
        {
          operationId,
          type: 'BUILD',
          payload: { type: buildingType, gridX, gridY },
          clientTimestamp: Date.now(),
        },
      ],
    };

    try {
      const payloadStr = JSON.stringify(payload);
      const curlCommand = `curl -X POST "http://localhost:4000/api/sync" -H "Content-Type: application/json" -d '${payloadStr}'`;
      const response = execSync(curlCommand, { encoding: 'utf8', stdio: 'pipe', timeout: 30000 });
      const responseData = JSON.parse(response);

      if (responseData.success) {
        console.log(`✓ Building ${buildingType} constructed successfully`);
        console.log(`Processed ${responseData.processedCount} operations`);
        return responseData;
      } else {
        console.log('⚠ Building construction failed:', responseData.error);
        return null;
      }
    } catch (error) {
      console.error('Building construction failed:', error.message);
      return null;
    }
  }

  async getCityData(cityId = 'test-city-id') {
    console.log('=== Fetching City Data ===');

    try {
      const response = execSync(`curl -s "http://localhost:4000/api/city/default"`, { encoding: 'utf8', stdio: 'pipe' });
      const cityData = JSON.parse(response);

      console.log(`City: ${cityData.name}`);
      console.log(`Gold: ${cityData.gold}`);
      console.log(`Population: ${cityData.population}`);
      console.log(`Buildings: ${cityData.buildings?.length || 0}`);

      return cityData;
    } catch (error) {
      console.error('Failed to fetch city data:', error.message);
      return null;
    }
  }

  async runSimulation(cityId = 'test-city-id') {
    console.log('=== Running Game Simulation ===');

    try {
      const response = execSync(`curl -X POST "http://localhost:4000/api/simulation/tick" -H "Content-Type: application/json" -d '{"cityId":"${cityId}"}'`, { encoding: 'utf8', stdio: 'pipe' });
      const simulationResult = JSON.parse(response);

      console.log(`Simulation completed:`);
      console.log(`Gold earned: ${simulationResult.goldEarned}`);
      console.log(`New population: ${simulationResult.newPopulation}`);

      return simulationResult;
    } catch (error) {
      console.error('Simulation failed:', error.message);
      return null;
    }
  }

  async stopAll() {
    console.log('=== Stopping NovaTown Services ===');

    // Stop all processes gracefully
    for (const [name, process] of this.processes) {
      console.log(`Stopping ${name} process...`);
      process.kill('SIGTERM');
    }

    this.isRunning = false;
    this.processes.clear();
    console.log('✓ All NovaTown services stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      healthStatus: this.healthStatus,
      processes: Array.from(this.processes.keys()),
    };
  }
}