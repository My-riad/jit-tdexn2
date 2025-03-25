package com.freightoptimization;

import android.os.Bundle;
import android.content.Intent;
import android.content.res.Configuration;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import org.devio.rn.splashscreen.SplashScreen;
import com.transistorsoft.locationmanager.RNBackgroundGeolocation;

/**
 * Main activity class for the driver mobile application's Android implementation. 
 * Serves as the entry point for the Android app, configuring React Native integration, 
 * handling deep links, and managing Android lifecycle events.
 */
public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript.
   * This is used to schedule rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "FreightOptimization";
  }

  /**
   * Called when the activity is first created.
   * Initializes the splash screen and sets up deep link handling.
   */
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // Show the splash screen
    SplashScreen.show(this);
    
    super.onCreate(savedInstanceState);
    
    // Initialize background location tracking with battery optimization
    RNBackgroundGeolocation.configure(this, null);
    
    // Process any deep links that may have launched the app
    if (getIntent() != null) {
      processDeepLink(getIntent());
    }
  }

  /**
   * Called when a new intent is received by the activity.
   * Handles deep links that come in after the app is already running.
   */
  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    processDeepLink(intent);
  }

  /**
   * Called when the device configuration changes (e.g., orientation change).
   * Ensures the app adapts properly to configuration changes.
   */
  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    // Handle any custom configuration changes if needed
    // This is useful for adjusting UI for landscape/portrait modes or other configuration changes
  }

  /**
   * Processes deep links from notifications or external sources.
   * Extracts link data and passes it to the React Native JavaScript code.
   */
  private void processDeepLink(Intent intent) {
    if (intent != null) {
      String action = intent.getAction();
      String data = intent.getDataString();
      
      if (Intent.ACTION_VIEW.equals(action) && data != null) {
        // Pass deep link data to React Native via the bridge
        // This will be handled by the JavaScript code
        // The actual implementation will use React Native Linking module
      }
      
      // Process notification extras if any
      Bundle extras = intent.getExtras();
      if (extras != null && extras.containsKey("notification_data")) {
        // Handle notification data that might contain screen navigation info
        // This will also be processed by the React Native code through the notification module
      }
    }
  }

  /**
   * Creates the ReactActivityDelegate for this activity.
   * This configures how React Native interacts with this Activity.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled()
    );
  }

  /**
   * Called when the activity is becoming visible to the user.
   * Resumes background services if needed.
   */
  @Override
  protected void onResume() {
    super.onResume();
    // Resume background location tracking if it was paused
    RNBackgroundGeolocation.onResume(this);
    
    // Check for any pending notifications
    // This would typically be handled by the React Native notification module
  }

  /**
   * Called when the activity is no longer visible to the user.
   * Ensures background services continue running if needed.
   */
  @Override
  protected void onPause() {
    super.onPause();
    // Ensure background location tracking continues if configured to do so
    // The background location service will manage battery optimization
    RNBackgroundGeolocation.onPause(this);
  }

  /**
   * Called when the activity is being destroyed.
   * Performs cleanup for background services.
   */
  @Override
  protected void onDestroy() {
    super.onDestroy();
    // Clean up any resources if needed
    // Most cleanup will be handled by React Native's lifecycle
  }
}