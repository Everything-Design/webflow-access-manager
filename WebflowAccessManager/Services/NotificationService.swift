import Foundation
import UserNotifications
import Combine
import AppKit  // For NSAlert and NSSound

class NotificationService: NSObject, ObservableObject {
    static let shared = NotificationService()
    
    private override init() {
        super.init()
        requestAuthorization()
        setupNotificationCategories()  // Register notification actions!
    }
    
    func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("✅ Notification permission GRANTED")
            } else {
                print("❌ Notification permission DENIED")
                if let error = error {
                    print("❌ Error: \(error.localizedDescription)")
                }
            }
        }
        
        // Check current permission status
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            print("🔔 Notification settings:")
            print("  Authorization status: \(settings.authorizationStatus.rawValue)")
            print("  Alert style: \(settings.alertStyle.rawValue)")
            print("  Badge enabled: \(settings.badgeSetting.rawValue)")
            print("  Sound enabled: \(settings.soundSetting.rawValue)")
        }
        
        UNUserNotificationCenter.current().delegate = self
    }
    
    func sendAccessRequestNotification(requesterName: String, accountName: String, requestId: String) {
        print("📬 Sending access request notification:")
        print("   Requester: \(requesterName)")
        print("   Account: \(accountName)")
        print("   Request ID: \(requestId)")
        
        let content = UNMutableNotificationContent()
        content.title = "Webflow Account Access Request"
        content.body = "\(requesterName) is requesting access to \(accountName)"
        content.sound = .defaultCritical // Use critical sound for more attention
        content.interruptionLevel = .timeSensitive // Ensures it appears on all spaces/desktops
        content.categoryIdentifier = "ACCESS_REQUEST"
        content.userInfo = [
            "requestId": requestId,
            "requesterName": requesterName,
            "accountName": accountName
        ]
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: requestId, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to send notification: \(error.localizedDescription)")
            } else {
                print("✅ Notification queued successfully")
                
                // Request user attention with critical priority (bounces dock icon)
                DispatchQueue.main.async {
                    NSApp.requestUserAttention(.criticalRequest)
                }
                
                // Also show a prominent alert window
                DispatchQueue.main.async {
                    // Activate the app so it's visible
                    NSApp.activate(ignoringOtherApps: true)
                    self.showAccessRequestAlert(requesterName: requesterName, accountName: accountName)
                }
            }
        }
    }
    
    private func showAccessRequestAlert(requesterName: String, accountName: String) {
        let alert = NSAlert()
        alert.messageText = "Access Request"
        alert.informativeText = "\(requesterName) is requesting access to \(accountName)"
        alert.alertStyle = .warning
        alert.addButton(withTitle: "OK")
        alert.icon = NSImage(systemSymbolName: "exclamationmark.triangle.fill", accessibilityDescription: nil)
        
        // Play alert sound
        NSSound.beep()
        
        alert.runModal()
    }
    
    func sendReminderNotification(requesterName: String, accountId: String, requestId: String) {
        let content = UNMutableNotificationContent()
        content.title = "Reminder: Access Request"
        content.body = "\(requesterName) is still waiting for access to \(accountId)"
        content.sound = .default
        content.categoryIdentifier = "ACCESS_REQUEST"
        content.userInfo = [
            "requestId": requestId,
            "requesterName": requesterName,
            "accountId": accountId
        ]
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: "\(requestId)-reminder", content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to send reminder: \(error.localizedDescription)")
            }
        }
    }
    
    func sendRequestApprovedNotification(accountId: String) {
        let content = UNMutableNotificationContent()
        content.title = "Access Granted"
        content.body = "\(accountId) is now available"
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to send notification: \(error.localizedDescription)")
            }
        }
    }
    
    func setupNotificationCategories() {
        let releaseAction = UNNotificationAction(
            identifier: "RELEASE_ACTION",
            title: "Release",
            options: [.foreground]
        )
        
        let remindAction = UNNotificationAction(
            identifier: "REMIND_ACTION",
            title: "Remind Me",
            options: []
        )
        
        let rejectAction = UNNotificationAction(
            identifier: "REJECT_ACTION",
            title: "Reject",
            options: [.destructive]
        )
        
        let category = UNNotificationCategory(
            identifier: "ACCESS_REQUEST",
            actions: [releaseAction, remindAction, rejectAction],
            intentIdentifiers: [],
            options: []
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([category])
    }
    
    func cancelNotification(requestId: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [requestId])
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [requestId])
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension NotificationService: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter, 
                               willPresent notification: UNNotification, 
                               withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .badge])
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, 
                               didReceive response: UNNotificationResponse, 
                               withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        
        guard let requestId = userInfo["requestId"] as? String else {
            completionHandler()
            return
        }
        
        Task {
            switch response.actionIdentifier {
            case "RELEASE_ACTION":
                // Handle release - will be implemented in AppState
                NotificationCenter.default.post(
                    name: NSNotification.Name("HandleAccessRequestRelease"),
                    object: nil,
                    userInfo: ["requestId": requestId]
                )
                
            case "REMIND_ACTION":
                // Send reminder in 5 minutes
                if let requesterName = userInfo["requesterName"] as? String,
                   let accountId = userInfo["accountId"] as? String {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 300) {
                        self.sendReminderNotification(
                            requesterName: requesterName,
                            accountId: accountId,
                            requestId: requestId
                        )
                    }
                }
                
            case "REJECT_ACTION":
                NotificationCenter.default.post(
                    name: NSNotification.Name("HandleAccessRequestReject"),
                    object: nil,
                    userInfo: ["requestId": requestId]
                )
                
            case UNNotificationDefaultActionIdentifier:
                // User tapped the notification
                NotificationCenter.default.post(
                    name: NSNotification.Name("ShowAccessRequest"),
                    object: nil,
                    userInfo: ["requestId": requestId]
                )
                
            default:
                break
            }
            
            completionHandler()
        }
    }
}
