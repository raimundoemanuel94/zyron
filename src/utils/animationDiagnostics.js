/**
 * Animation Diagnostics — Debug tool for exercise animation loading
 *
 * Usage: Open browser DevTools Console (F12) to see:
 * - Which exercises loaded animations successfully ✓
 * - Which exercises failed to load ✗
 * - Direct links to test frame loading
 */

export const logAnimationDiagnostics = (exerciseName, frame0, frame1) => {
  if (!window.ANIMATION_LOG) {
    window.ANIMATION_LOG = {};
  }

  window.ANIMATION_LOG[exerciseName] = {
    frame0,
    frame1,
    timestamp: new Date().toISOString(),
  };

  // Log to console with color coding
  const style0 = frame0 ? '✓ color: #4ade80' : '✗ color: #ef4444';
  const style1 = frame1 ? '✓ color: #4ade80' : '✗ color: #ef4444';

  console.group(`%c📋 ${exerciseName}`, 'font-weight: bold; color: #fbbf24; font-size: 12px');
  console.log(`%cFrame 0: ${frame0 ? '✓ OK' : '✗ MISSING'}`, style0);
  if (frame0) console.log(`  URL: ${frame0}`);
  console.log(`%cFrame 1: ${frame1 ? '✓ OK' : '✗ MISSING'}`, style1);
  if (frame1) console.log(`  URL: ${frame1}`);
  console.groupEnd();
};

/**
 * Print summary of all animation loads
 */
export const printAnimationSummary = () => {
  if (!window.ANIMATION_LOG) {
    console.warn('No animation data logged yet. Open some exercises first.');
    return;
  }

  const exercises = Object.entries(window.ANIMATION_LOG);
  const successful = exercises.filter(([_, data]) => data.frame0 && data.frame1);
  const failed = exercises.filter(([_, data]) => !data.frame0 || !data.frame1);

  console.group('%c📊 ANIMATION SUMMARY', 'font-weight: bold; font-size: 14px; color: #fbbf24');
  console.log(`Total exercises logged: ${exercises.length}`);
  console.log(`✓ Working animations: ${successful.length}`);
  console.log(`✗ Failed animations: ${failed.length}`);

  if (failed.length > 0) {
    console.group('%c⚠️ Exercises with missing frames:', 'color: #ef4444; font-weight: bold');
    failed.forEach(([name, _]) => {
      console.log(`  - ${name}`);
    });
    console.groupEnd();
  }

  console.groupEnd();
};

/**
 * Test a single frame URL
 */
export const testFrameUrl = async (exerciseName, frameUrl) => {
  console.log(`🔍 Testing frame for ${exerciseName}...`);

  try {
    const response = await fetch(frameUrl, { mode: 'no-cors' });
    console.log(`✓ Frame URL accessible: ${frameUrl}`);
    console.log(`  Status: ${response.status}`);
  } catch (error) {
    console.error(`✗ Frame URL failed: ${frameUrl}`);
    console.error(`  Error: ${error.message}`);
  }
};

// Auto-register console commands
if (typeof window !== 'undefined') {
  window.animationDiagnostics = {
    summary: printAnimationSummary,
    test: testFrameUrl,
    log: window.ANIMATION_LOG,
  };

  console.log('%c🏋️ ZYRON Animation Diagnostics Ready!', 'color: #fbbf24; font-weight: bold; font-size: 12px');
  console.log('Use these commands in DevTools:');
  console.log('  animationDiagnostics.summary()  — Show all animations status');
  console.log('  animationDiagnostics.log        — View raw animation data');
}
