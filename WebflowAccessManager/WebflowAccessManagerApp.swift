import SwiftUI
import FirebaseCore

@main
struct WebflowAccessManagerApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var authService = AuthService.shared
    @StateObject private var appState = AppState.shared
    
    init() {
        // Configure Firebase BEFORE any StateObjects try to access it
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        // Main Window
        Window("Webflow Access Manager", id: "main") {
            Group {
                if authService.isAuthenticated {
                    NavigationStack {
                        DashboardView()
                    }
                } else {
                    OnboardingView()
                }
            }
            .onAppear {
                if authService.isAuthenticated {
                    FirebaseService.shared.setupListeners()
                }
            }
        }
        .windowResizability(.contentSize)
        .windowStyle(.hiddenTitleBar)
        .commands {
            CommandGroup(replacing: .newItem) { }
        }
        
        // Menu Bar Extra
        MenuBarExtra {
            MenuBarPopoverView()
        } label: {
            Image(systemName: menuBarIcon)
                .symbolRenderingMode(.palette)
                .foregroundStyle(menuBarColor, .primary)
        }
        .menuBarExtraStyle(.window)
    }
    
    private var menuBarIcon: String {
        if !appState.pendingRequestForCurrentUser.isEmpty {
            return "exclamationmark.circle.fill"
        } else if appState.isConnected {
            return "circle.fill"
        } else {
            return "circle"
        }
    }
    
    private var menuBarColor: Color {
        if !appState.pendingRequestForCurrentUser.isEmpty {
            return .orange
        } else if !appState.availableAccounts.isEmpty {
            return .green
        } else if !appState.accounts.isEmpty {
            return .red
        } else {
            return .gray
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Setup notifications
        NotificationService.shared.setupNotificationCategories()
        
        // Setup Firebase listeners if authenticated
        if AuthService.shared.isAuthenticated {
            FirebaseService.shared.setupListeners()
        }
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        // Cleanup
        if let user = AuthService.shared.currentUser {
            Task {
                try? await FirebaseService.shared.updateUserPresence(userId: user.id, online: false)
            }
        }
        
        FirebaseService.shared.removeListeners()
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        // Keep app running in menu bar even when window is closed
        return false
    }
}
