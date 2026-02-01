#!/usr/bin/env node

// Auto-Restart Server Script
// This script monitors for changes and automatically restarts the server

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoRestarter {
  constructor() {
    this.serverProcess = null;
    this.isRestarting = false;
    this.restartDelay = 2000; // 2 seconds delay
    this.watchFiles = [
      'src/**/*.ts',
      'src/**/*.js',
      '.env',
      '.env.local',
      'package.json'
    ];
  }

  startServer() {
    console.log('🚀 Starting NestJS server...');
    
    this.serverProcess = spawn('npm', ['run', 'start:dev'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    this.serverProcess.on('close', (code) => {
      if (code !== 0 && !this.isRestarting) {
        console.log(`❌ Server exited with code ${code}`);
        console.log('🔄 Restarting server...');
        setTimeout(() => this.startServer(), this.restartDelay);
      }
    });

    this.serverProcess.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (!this.isRestarting) {
        setTimeout(() => this.startServer(), this.restartDelay);
      }
    });
  }

  restartServer() {
    if (this.isRestarting) return;
    
    this.isRestarting = true;
    console.log('🔄 Restarting server...');
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      
      setTimeout(() => {
        this.startServer();
        this.isRestarting = false;
      }, this.restartDelay);
    } else {
      this.startServer();
      this.isRestarting = false;
    }
  }

  watchForChanges() {
    const chokidar = require('chokidar');
    
    const watcher = chokidar.watch(this.watchFiles, {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', (filePath) => {
      console.log(`📝 File changed: ${filePath}`);
      this.restartServer();
    });

    watcher.on('add', (filePath) => {
      console.log(`➕ File added: ${filePath}`);
      this.restartServer();
    });

    console.log('👀 Watching for file changes...');
  }

  start() {
    console.log('🤖 Auto-Restarter Started');
    console.log('========================');
    
    try {
      this.watchForChanges();
      this.startServer();
    } catch (error) {
      console.error('❌ Failed to start auto-restarter:', error);
      console.log('💡 Make sure chokidar is installed: npm install chokidar');
      process.exit(1);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down auto-restarter...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down auto-restarter...');
  process.exit(0);
});

// Start the auto-restarter
const restarter = new AutoRestarter();
restarter.start();
