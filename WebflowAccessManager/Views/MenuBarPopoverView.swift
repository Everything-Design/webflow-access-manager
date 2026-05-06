import SwiftUI

struct MenuBarPopoverView: View {
    @StateObject private var appState = AppState.shared
    @StateObject private var authService = AuthService.shared
    @Environment(\.openWindow) private var openWindow
    
    var body: some View {
        VStack(spacing: 0) {
            // Quick Status Header
            headerSection
                .padding()
            
            Divider()
            
            // Quick Account Overview
            ScrollView {
                VStack(spacing: 12) {
                    accountsOverview
                    
                    if !appState.clientAccounts.isEmpty {
                        Divider()
                        clientAccountsOverview
                    }
                    
                    if !appState.pendingRequestForCurrentUser.isEmpty {
                        Divider()
                        pendingRequestsBadge
                    }
                }
                .padding()
            }
            .frame(maxHeight: 300)
            
            Divider()
            
            // Actions
            actionsSection
                .padding()
        }
        .frame(width: 320)
    }
    
    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                if let user = authService.currentUser {
                    Text(user.name)
                        .font(.headline)
                    
                    HStack(spacing: 4) {
                        Circle()
                            .fill(appState.isConnected ? Color.green : Color.red)
                            .frame(width: 6, height: 6)
                        
                        Text(appState.isConnected ? "Online" : "Offline")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            // Status Icon
            Image(systemName: menuBarStatusIcon)
                .font(.title3)
                .foregroundStyle(menuBarStatusColor)
        }
    }
    
    private var accountsOverview: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Internal Accounts")
                .font(.caption)
                .foregroundColor(.secondary)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(appState.accounts.prefix(5)) { account in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(account.isAvailable ? Color.green : Color.red)
                                .frame(width: 8, height: 8)
                            
                            Text(account.label ?? account.id)
                                .font(.caption)
                                .fontWeight(.medium)
                                .lineLimit(1)
                            
                            Spacer()
                        }
                        
                        // Show timer for occupied accounts
                        if !account.isAvailable && !account.duration.isEmpty {
                            TimelineView(.periodic(from: Date(), by: 60)) { _ in
                                Text(account.duration)
                                    .font(.caption2)
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                    .padding(6)
                    .background(Color(.controlBackgroundColor))
                    .cornerRadius(4)
                }
            }
            
            if let myAccount = appState.myInternalAccount {
                let accountName = myAccount.label ?? myAccount.id
                Text("You're using \(accountName)")
                    .font(.caption2)
                    .foregroundColor(.blue)
            } else {
                Text("\(appState.availableAccounts.count) available")
                    .font(.caption2)
                    .foregroundColor(.green)
            }
        }
    }
    
    private var clientAccountsOverview: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Client Accounts")
                .font(.caption)
                .foregroundColor(.secondary)
            
            VStack(spacing: 4) {
                ForEach(appState.clientAccounts.prefix(3)) { clientAccount in
                    HStack {
                        Circle()
                            .fill(Color.purple)
                            .frame(width: 6, height: 6)
                        
                        Text(clientAccount.clientName)
                            .font(.caption)
                        
                        Spacer()
                        
                        Text(clientAccount.userName ?? "")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }
    
    private var pendingRequestsBadge: some View {
        HStack {
            Image(systemName: "exclamationmark.circle.fill")
                .foregroundColor(.orange)
            
            Text("\(appState.pendingRequestForCurrentUser.count) pending request(s)")
                .font(.caption)
                .fontWeight(.medium)
            
            Spacer()
        }
        .padding(8)
        .background(Color.orange.opacity(0.1))
        .cornerRadius(6)
    }
    
    private var actionsSection: some View {
        VStack(spacing: 8) {
            Button(action: {
                NSApp.activate(ignoringOtherApps: true)
                openWindow(id: "main")
            }) {
                Label("Open Dashboard", systemImage: "square.grid.2x2")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            
            Button(action: {
                NSApplication.shared.terminate(nil)
            }) {
                Label("Quit", systemImage: "xmark.circle")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        }
    }
    
    private var menuBarStatusIcon: String {
        if !appState.pendingRequestForCurrentUser.isEmpty {
            return "exclamationmark.circle.fill"
        } else if appState.availableAccounts.isEmpty {
            return "circle.fill"
        } else {
            return "checkmark.circle.fill"
        }
    }
    
    private var menuBarStatusColor: Color {
        if !appState.pendingRequestForCurrentUser.isEmpty {
            return .orange
        } else if appState.availableAccounts.isEmpty {
            return .red
        } else if appState.availableAccounts.count > 0 {
            return .green
        } else {
            return .gray
        }
    }
}

#Preview {
    MenuBarPopoverView()
}
