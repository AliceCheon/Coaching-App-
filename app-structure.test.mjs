import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;

test('index.html exists and has correct structure', async () => {
  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  
  assert.ok(html.includes('<!doctype html>'), 'should have doctype');
  assert.ok(html.includes('Barbell diva'), 'should contain app title');
  assert.ok(html.includes('src/app-main.js'), 'should reference app-main.js');
  assert.ok(html.includes('src/utils-global.js'), 'should reference utils-global.js');
});

test('main source files exist', async () => {
  const files = [
    'src/app-main.js',
    'src/utils-global.js',
    'src/utils.js',
    'src/firebase-app-check.js',
    'index.html',
    'manifest.webmanifest',
    'service-worker.js'
  ];
  
  for (const file of files) {
    const filePath = path.join(rootDir, file);
    await assert.doesNotReject(
      fs.access(filePath),
      `file ${file} should exist`
    );
  }
});

test('app-main.js contains expected constants and data', async () => {
  const content = await fs.readFile(path.join(rootDir, 'src/app-main.js'), 'utf8');
  
  // Check for key constants
  assert.ok(content.includes('STORE_KEY'), 'should have STORE_KEY constant');
  assert.ok(content.includes('DIVA_QUOTES'), 'should have DIVA_QUOTES array');
  assert.ok(content.includes('BIOMECHANICS_KNOWLEDGE_BASE'), 'should have biomechanics knowledge base');
  assert.ok(content.includes('EXERCISE_ALIASES'), 'should have exercise aliases');
  assert.ok(content.includes('PROGRAM_LIBRARY'), 'should have program library');
});

test('utils-global.js exists and has content', async () => {
  const content = await fs.readFile(path.join(rootDir, 'src/utils-global.js'), 'utf8');
  assert.ok(content.length > 0, 'utils-global.js should not be empty');
});

test('package.json has correct test script', async () => {
  const pkg = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
  
  assert.ok(pkg.scripts.test, 'should have test script');
  assert.ok(pkg.scripts.dev, 'should have dev script');
  assert.ok(pkg.scripts.build, 'should have build script');
});

test('CSS files are referenced in index.html', async () => {
  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  
  const cssFiles = [
    'coach-studio.css',
    'coach-program-editor-19.8.css',
    'workout-flow-v147.css'
  ];
  
  for (const css of cssFiles) {
    assert.ok(html.includes(css), `should reference ${css}`);
  }
});

test('JavaScript files are loaded in correct order', async () => {
  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  
  // Verify script load order
  const utilsGlobalPos = html.indexOf('src/utils-global.js');
  const appMainPos = html.indexOf('src/app-main.js');
  
  assert.ok(utilsGlobalPos < appMainPos, 'utils-global.js should load before app-main.js');
});

test('PR celebrations module is loaded', async () => {
  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  
  assert.ok(html.includes('src/pr-celebrations.js'), 'should reference pr-celebrations.js');
});

test('PR celebrations file exists and has content', async () => {
  const content = await fs.readFile(path.join(rootDir, 'src/pr-celebrations.js'), 'utf8');
  
  assert.ok(content.includes('BarbellDivaPRCelebrations'), 'should expose BarbellDivaPRCelebrations API');
  assert.ok(content.includes('checkAndCelebratePR'), 'should have checkAndCelebratePR function');
  assert.ok(content.includes('launchConfetti'), 'should have launchConfetti function');
  assert.ok(content.includes('showPRCelebration'), 'should have showPRCelebration function');
});

test('Consistency heatmap module is loaded', async () => {
  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  
  assert.ok(html.includes('src/consistency-heatmap.js'), 'should reference consistency-heatmap.js');
});

test('Consistency heatmap file exists and has content', async () => {
  const content = await fs.readFile(path.join(rootDir, 'src/consistency-heatmap.js'), 'utf8');
  
  assert.ok(content.includes('BarbellDivaConsistencyHeatmap'), 'should expose BarbellDivaConsistencyHeatmap API');
  assert.ok(content.includes('recordWorkoutDay'), 'should have recordWorkoutDay function');
  assert.ok(content.includes('calculateStreak'), 'should have calculateStreak function');
  assert.ok(content.includes('createHeatmapGrid'), 'should have createHeatmapGrid function');
  assert.ok(content.includes('getIntensityColor'), 'should have getIntensityColor function');
});

test('Progress charts module is loaded', async () => {
  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  
  assert.ok(html.includes('src/progress-charts.js'), 'should reference progress-charts.js');
});

test('Progress charts file exists and has content', async () => {
  const content = await fs.readFile(path.join(rootDir, 'src/progress-charts.js'), 'utf8');
  
  assert.ok(content.includes('BarbellDivaProgressCharts'), 'should expose BarbellDivaProgressCharts API');
  assert.ok(content.includes('calculateE1RM'), 'should have calculateE1RM function');
  assert.ok(content.includes('recordSet'), 'should have recordSet function');
  assert.ok(content.includes('createSparkline'), 'should have createSparkline function');
  assert.ok(content.includes('createProgressCard'), 'should have createProgressCard function');
  assert.ok(content.includes('getBestE1RM'), 'should have getBestE1RM function');
});

test('Quick log module is loaded', async () => {
  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  
  assert.ok(html.includes('src/quick-log.js'), 'should reference quick-log.js');
});

test('Quick log file exists and has content', async () => {
  const content = await fs.readFile(path.join(rootDir, 'src/quick-log.js'), 'utf8');
  
  assert.ok(content.includes('BarbellDivaQuickLog'), 'should expose BarbellDivaQuickLog API');
  assert.ok(content.includes('recordQuickSet'), 'should have recordQuickSet function');
  assert.ok(content.includes('getLastSet'), 'should have getLastSet function');
  assert.ok(content.includes('showQuickLogModal'), 'should have showQuickLogModal function');
  assert.ok(content.includes('getRecentExercises'), 'should have getRecentExercises function');
});

test('UI enhancements module is loaded', async () => {
  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  
  assert.ok(html.includes('src/ui-enhancements.js'), 'should reference ui-enhancements.js');
});

test('UI enhancements file exists and has content', async () => {
  const content = await fs.readFile(path.join(rootDir, 'src/ui-enhancements.js'), 'utf8');
  
  // Micro-interactions
  assert.ok(content.includes('BarbellDivaUI'), 'should expose BarbellDivaUI API');
  assert.ok(content.includes('triggerHaptic'), 'should have triggerHaptic function');
  assert.ok(content.includes('showAnimatedCheck'), 'should have showAnimatedCheck function');
  assert.ok(content.includes('createSessionProgress'), 'should have createSessionProgress function');
  assert.ok(content.includes('miniConfettiBurst'), 'should have miniConfettiBurst function');
  
  // Empty states
  assert.ok(content.includes('createEmptyState'), 'should have createEmptyState function');
  
  // Skeleton loading
  assert.ok(content.includes('createSkeletonLoader'), 'should have createSkeletonLoader function');
  assert.ok(content.includes('createLoadingSpinner'), 'should have createLoadingSpinner function');
  assert.ok(content.includes('replaceSkeleton'), 'should have replaceSkeleton function');
  
  // Notifications
  assert.ok(content.includes('showToast'), 'should have showToast function');
});

test('Diva personality module is loaded', async () => {
  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  
  assert.ok(html.includes('src/diva-personality.js'), 'should reference diva-personality.js');
});

test('Diva personality file exists and has content', async () => {
  const content = await fs.readFile(path.join(rootDir, 'src/diva-personality.js'), 'utf8');
  
  assert.ok(content.includes('BarbellDivaPersonality'), 'should expose BarbellDivaPersonality API');
  assert.ok(content.includes('MOODS'), 'should have MOODS constant');
  assert.ok(content.includes('MESSAGES'), 'should have MESSAGES constant');
  assert.ok(content.includes('getContextualMessage'), 'should have getContextualMessage function');
  assert.ok(content.includes('createDivaAvatar'), 'should have createDivaAvatar function');
  assert.ok(content.includes('showDivaMessage'), 'should have showDivaMessage function');
  assert.ok(content.includes('analyzeAndReact'), 'should have analyzeAndReact function');
});

test('Goals & stats module is loaded', async () => {
  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  
  assert.ok(html.includes('src/goals-stats.js'), 'should reference goals-stats.js');
});

test('Goals & stats file exists and has content', async () => {
  const content = await fs.readFile(path.join(rootDir, 'src/goals-stats.js'), 'utf8');
  
  assert.ok(content.includes('BarbellDivaGoalsStats'), 'should expose BarbellDivaGoalsStats API');
  assert.ok(content.includes('loadGoals'), 'should have loadGoals function');
  assert.ok(content.includes('updateGoalProgress'), 'should have updateGoalProgress function');
  assert.ok(content.includes('calculateCurrentStreak'), 'should have calculateCurrentStreak function');
  assert.ok(content.includes('getWeeklyVolume'), 'should have getWeeklyVolume function');
  assert.ok(content.includes('getFatigueRatio'), 'should have getFatigueRatio function');
  assert.ok(content.includes('getPRSummary'), 'should have getPRSummary function');
});

test('Notifications module is loaded', async () => {
  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  
  assert.ok(html.includes('src/notifications.js'), 'should reference notifications.js');
});

test('Notifications file exists and has content', async () => {
  const content = await fs.readFile(path.join(rootDir, 'src/notifications.js'), 'utf8');
  
  assert.ok(content.includes('BarbellDivaNotifications'), 'should expose BarbellDivaNotifications API');
  assert.ok(content.includes('isSupported'), 'should have isSupported function');
  assert.ok(content.includes('requestPermission'), 'should have requestPermission function');
  assert.ok(content.includes('showNotification'), 'should have showNotification function');
  assert.ok(content.includes('scheduleWorkoutReminder'), 'should have scheduleWorkoutReminder function');
  assert.ok(content.includes('showStreakReminder'), 'should have showStreakReminder function');
  assert.ok(content.includes('showPRNotification'), 'should have showPRNotification function');
});
