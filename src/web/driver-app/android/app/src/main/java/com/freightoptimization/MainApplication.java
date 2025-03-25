package com.freightoptimization;

import android.app.Application;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import java.util.List;
import java.util.ArrayList;
import android.content.Context;

// Third-party package imports (with versions)
import com.transistorsoft.locationmanager.RNBackgroundGeolocation; // v4.13.0
import com.google.firebase.messaging.FirebaseMessaging; // v23.1.2
import org.devio.rn.splashscreen.SplashScreenReactPackage; // v3.3.0
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage; // v1.18.1
import com.reactnativecommunity.netinfo.NetInfoPackage; // v9.3.10
import com.airbnb.android.react.maps.MapsPackage; // v1.7.1
import com.swmansion.gesturehandler.RNGestureHandlerPackage; // v2.10.1
import com.swmansion.reanimated.ReanimatedPackage; // v3.1.0
import com.th3rdwave.safeareacontext.SafeAreaContextPackage; // v4.5.3
import com.swmansion.rnscreens.RNScreensPackage; // v3.20.0
import com.horcrux.svg.SvgPackage; // v13.9.0
import com.oblador.vectoricons.VectorIconsPackage; // v9.2.0
import com.learnium.RNDeviceInfo.RNDeviceInfo; // v10.6.0
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage; // v1.5.1
import com.zoontek.rnpermissions.RNPermissionsPackage; // v3.8.0

/**
 * Main application class for the Android application that initializes React Native,
 * registers native modules, and manages the application lifecycle.
 */
public class MainApplication extends Application implements ReactApplication {

  /**
   * Private instance of ReactNativeHost that manages the React instance
   */
  private final ReactNativeHost mReactNativeHost = new ReactNativeHostImpl();
  
  /**
   * Private instance for the new React Native architecture
   */
  private final ReactNativeHost mNewArchitectureNativeHost = new DefaultReactNativeHost(this) {
    @Override
    protected boolean isNewArchEnabled() {
      return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
    }

    @Override
    protected Boolean isHermesEnabled() {
      return BuildConfig.IS_HERMES_ENABLED;
    }
  };

  /**
   * Called when the application is starting, before any activity, service, 
   * or receiver objects have been created
   */
  @Override
  public void onCreate() {
    super.onCreate();
    
    // Initialize SoLoader for loading native libraries
    SoLoader.init(this, /* native exopackage */ false);
    
    // Initialize background location tracking with battery optimization
    // Configure with optimal settings for truck drivers that balances accuracy and battery life
    RNBackgroundGeolocation.initialize(this);
    RNBackgroundGeolocation.configure(getApplicationContext(), 
        "{" +
            "\"desiredAccuracy\": 10, " +            // 10 meters
            "\"distanceFilter\": 50, " +             // 50 meters
            "\"stopTimeout\": 5, " +                 // 5 minutes
            "\"startOnBoot\": true, " +              // Auto-start tracking when device reboots
            "\"stopOnTerminate\": false, " +         // Continue tracking when app is terminated
            "\"enableHeadless\": true, " +           // Enable background operation
            "\"foregroundService\": true, " +        // Run as foreground service for reliability
            "\"notification\": {" +
                "\"title\": \"Freight Optimization\", " +
                "\"text\": \"Tracking active for load matching\"" +
            "}, " +
            "\"maxRecordsToPersist\": 1000" +       // Store up to 1000 locations when offline
        "}"
    );
    
    // Initialize Firebase for push notifications
    FirebaseMessaging.getInstance().setAutoInitEnabled(true);

    // If you opted-in for the New Architecture, enable the TurboModule system
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      DefaultNewArchitectureEntryPoint.load();
    }
    
    // Initialize Flipper for debugging in development mode
    initializeFlipper(this);
  }

  /**
   * Returns the ReactNativeHost that contains the React instance for this application
   */
  @Override
  public ReactNativeHost getReactNativeHost() {
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      return mNewArchitectureNativeHost;
    } else {
      return mReactNativeHost;
    }
  }

  /**
   * Returns the list of React Native packages for this application
   */
  protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new ArrayList<>();
    
    // Add all required packages for the application
    
    // Maps integration for interactive maps and route visualization
    packages.add(new MapsPackage());
    
    // Splash screen for better user experience
    packages.add(new SplashScreenReactPackage());
    
    // Async storage for local data persistence and offline capabilities
    packages.add(new AsyncStoragePackage());
    
    // Network connectivity monitoring for offline mode detection
    packages.add(new NetInfoPackage());
    
    // Gesture handler for interactive UI elements
    packages.add(new RNGestureHandlerPackage());
    
    // Reanimated for smooth animations and interactive elements
    packages.add(new ReanimatedPackage());
    
    // Safe area context for handling notches and system UI elements
    packages.add(new SafeAreaContextPackage());
    
    // Optimized screen containers for navigation
    packages.add(new RNScreensPackage());
    
    // SVG support for vector graphics and icons
    packages.add(new SvgPackage());
    
    // Vector icons for UI elements
    packages.add(new VectorIconsPackage());
    
    // Device info for platform-specific adaptations and telemetry
    packages.add(new RNDeviceInfo());
    
    // Environment configuration for different build variants
    packages.add(new ReactNativeConfigPackage());
    
    // Permission handling for location, notifications, etc.
    packages.add(new RNPermissionsPackage());
    
    return packages;
  }

  /**
   * Initializes Flipper for debugging in development mode
   * @param context The application context
   */
  private static void initializeFlipper(Context context) {
    if (BuildConfig.DEBUG) {
      try {
        // We use reflection here to pick up the class that initializes Flipper,
        // since Flipper library is not available in release mode
        Class<?> aClass = Class.forName("com.freightoptimization.ReactNativeFlipper");
        aClass.getMethod("initializeFlipper", Context.class).invoke(null, context);
      } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException |
               java.lang.reflect.InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }

  /**
   * Custom implementation of ReactNativeHost for the application
   */
  private class ReactNativeHostImpl extends ReactNativeHost {
    public ReactNativeHostImpl() {
      super(MainApplication.this);
    }

    @Override
    public String getJSMainModuleName() {
      // Return "index" which points to index.js as the entry point
      return "index";
    }

    @Override
    public boolean getUseDeveloperSupport() {
      // Return BuildConfig.DEBUG to enable developer support in debug builds
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      // Call MainApplication.this.getPackages() to get the list of packages
      return MainApplication.this.getPackages();
    }
  }
}