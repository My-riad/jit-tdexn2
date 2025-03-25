/**
 * FreightOptimization Driver Application
 * AppDelegate.h
 * 
 * Main application entry point that handles lifecycle events,
 * push notifications, deep linking, and core functionality.
 */

#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
#import <React/RCTBridgeDelegate.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, UNUserNotificationCenterDelegate>

@property (nonatomic, strong) UIWindow *window;

/**
 * Called when the application has finished launching.
 * Initializes React Native, Firebase, and other core services.
 *
 * @param application The singleton app object.
 * @param launchOptions A dictionary containing launch options.
 * @return YES if the app was successfully launched.
 */
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions;

/**
 * Provides the URL for the JavaScript bundle.
 *
 * @param bridge The React Native bridge instance.
 * @return URL to the JavaScript bundle location.
 */
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge;

/**
 * Called when the app successfully registers for push notifications.
 *
 * @param application The singleton app object.
 * @param deviceToken The device token provided by Apple Push Notification service.
 */
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;

/**
 * Called when a remote notification is received.
 *
 * @param application The singleton app object.
 * @param userInfo A dictionary containing notification data.
 * @param completionHandler Block to execute when fetch is complete.
 */
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler;

/**
 * Called when the app is opened via a URL scheme (deep linking).
 *
 * @param app The singleton app object.
 * @param url The URL resource to open.
 * @param options A dictionary of URL handling options.
 * @return YES if the delegate successfully handled the request.
 */
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options;

/**
 * Called when the app is opened via Universal Link.
 *
 * @param application The singleton app object.
 * @param userActivity The activity object containing the data for the task.
 * @param restorationHandler Block to execute for state restoration.
 * @return YES if the delegate successfully handled the request.
 */
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler;

/**
 * Called when user interacts with a notification.
 *
 * @param center The notification center object.
 * @param response The user's response to the notification.
 * @param completionHandler The block to execute when you have finished processing the notification.
 */
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void(^)(void))completionHandler;

@end