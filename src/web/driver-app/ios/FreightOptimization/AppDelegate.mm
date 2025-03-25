#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>

#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>
#import <RNSplashScreen.h>
#import <RNCPushNotificationIOS.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Configure Firebase with default options
  [FIRApp configure];
  
  // Set up push notification handling
  if ([UNUserNotificationCenter class] != nil) {
    // Set the delegate for UNUserNotificationCenter
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    center.delegate = self;
    
    // Define notification categories for action buttons
    UNNotificationCategory *loadCategory = [UNNotificationCategory 
                                           categoryWithIdentifier:@"LOAD_CATEGORY"
                                           actions:@[]
                                           intentIdentifiers:@[]
                                           options:UNNotificationCategoryOptionCustomDismissAction];
    
    // Register the notification categories
    [center setNotificationCategories:[NSSet setWithObjects:loadCategory, nil]];
    
    // Request authorization for notifications
    UNAuthorizationOptions options = UNAuthorizationOptionAlert | 
                                     UNAuthorizationOptionSound | 
                                     UNAuthorizationOptionBadge;
    [center requestAuthorizationWithOptions:options
                          completionHandler:^(BOOL granted, NSError * _Nullable error) {
      if (error) {
        NSLog(@"Request authorization for notifications failed: %@", error);
      } else {
        NSLog(@"Push notification authorization granted: %d", granted);
      }
    }];
  }
  
  // Register for remote notifications
  [application registerForRemoteNotifications];
  
  // Initialize React Native
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"FreightOptimization"
                                            initialProperties:nil];

  // Set root view background color based on system appearance
  if (@available(iOS 13.0, *)) {
    rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  // Configure the app window
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  // Initialize the splash screen
  [RNSplashScreen show];
  
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  // In debug mode, use the development server
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  // In release mode, use the bundled JavaScript file
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Handle successful registration for remote notifications
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  // Forward to React Native push notification module
  [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
  
  // Convert token to string format for logging or custom handling
  const unsigned char *tokenBytes = (const unsigned char *)[deviceToken bytes];
  NSMutableString *tokenString = [NSMutableString string];
  for (NSInteger i = 0; i < deviceToken.length; i++) {
    [tokenString appendFormat:@"%02x", tokenBytes[i]];
  }
  NSLog(@"Device token for push notifications: %@", tokenString);
  
  // Here you could send the token to your notification service
}

// Handle failed registration for remote notifications
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  // Forward to React Native push notification module
  [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
  NSLog(@"Failed to register for remote notifications: %@", error);
}

// Handle received remote notifications
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  // Forward to React Native push notification module
  [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
  
  // Process the notification data here if needed
  NSLog(@"Received remote notification: %@", userInfo);
  
  // Call the completion handler with the appropriate result
  completionHandler(UIBackgroundFetchResultNewData);
}

// Handle notifications received while app is in foreground
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  // Forward to React Native push notification module
  [RNCPushNotificationIOS willPresentNotification:notification withCompletionHandler:completionHandler];
  
  // Show the notification even when the app is in foreground
  if (@available(iOS 14.0, *)) {
    completionHandler(UNNotificationPresentationOptionList | UNNotificationPresentationOptionBanner | UNNotificationPresentationOptionSound | UNNotificationPresentationOptionBadge);
  } else {
    completionHandler(UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionSound | UNNotificationPresentationOptionBadge);
  }
}

// Handle user interaction with notifications
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void(^)(void))completionHandler
{
  // Forward to React Native push notification module
  [RNCPushNotificationIOS didReceiveNotificationResponse:response withCompletionHandler:completionHandler];
  
  // Extract notification data for deep linking if needed
  NSDictionary *userInfo = response.notification.request.content.userInfo;
  NSString *deepLink = userInfo[@"deepLink"];
  if (deepLink) {
    NSURL *url = [NSURL URLWithString:deepLink];
    if (url) {
      [RCTLinkingManager openURL:url];
    }
  }
  
  completionHandler();
}

// Handle opening app via URL scheme (deep linking)
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  // Forward to React Native linking manager to handle deep linking
  return [RCTLinkingManager application:app openURL:url options:options];
}

// Handle opening app via Universal Link
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  // Forward to React Native linking manager to handle Universal Links
  return [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
}

@end