import SwiftUI

struct DashboardView: View {
    @StateObject private var appState = AppState.shared
    @State private var showingClientAccountDialog = false
    @State private var showingAddAccountDialog = false
    @State private var clientNameInput = ""
    @State private var newAccountNumber = ""
    @State private var newAccountLabel = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                headerSection
                
                Divider()
                
                // Internal Accounts
                internalAccountsSection
                
                Divider()
                
                // Client Accounts
                clientAccountsSection
                
                Divider()
                
                // Pending Requests
                if !appState.pendingRequestForCurrentUser.isEmpty {
                    pendingRequestsSection
                }
            }
            .padding()
        }
        .frame(width: 450, height: 600)
        .sheet(isPresented: $showingClientAccountDialog) {
            clientAccountDialog
        }
        .sheet(isPresented: $showingAddAccountDialog) {
            addAccountDialog
        }
    }
    
    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                if let user = appState.currentUser {
                    Text("Hello, \(user.name)")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    HStack(spacing: 4) {
                        Circle()
                            .fill(appState.isConnected ? Color.green : Color.red)
                            .frame(width: 8, height: 8)
                        
                        Text(appState.isConnected ? "Connected" : "Offline")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            NavigationLink(destination: SettingsView()) {
                Image(systemName: "gearshape.fill")
                    .font(.title3)
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
        }
    }
    
    private var internalAccountsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Internal Webflow Accounts")
                    .font(.headline)
                
                Spacer()
                
                // Admin-only: Add new account slot
                if isAdmin {
                    Button(action: { 
                        print("🔵 Add Slot button clicked!")
                        print("🔵 isAdmin: \(isAdmin)")
                        showingAddAccountDialog = true
                        print("🔵 showingAddAccountDialog set to: \(showingAddAccountDialog)")
                    }) {
                        Label("Add Slot", systemImage: "plus.circle.fill")
                            .font(.caption)
                    }
                    .buttonStyle(.plain)
                    .foregroundColor(.blue)
                }
            }
            
            if appState.accounts.isEmpty {
                HStack {
                    ProgressView()
                        .controlSize(.small)
                    Text("Loading accounts...")
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
            } else {
                VStack(spacing: 8) {
                    ForEach(appState.accounts) { account in
                        AccountRow(account: account)
                    }
                }
            }
        }
    }
    
    // Admin check - only Saurabh can create account slots
    private var isAdmin: Bool {
        guard let userId = appState.currentUser?.id else { return false }
        // Saurabh's user ID from Firebase
        return userId == "ADF18B6F-B4C5-4F77-82B4-B34BACEB2BFB"
    }
    
    private var clientAccountsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Client Accounts")
                    .font(.headline)
                
                Spacer()
                
                if appState.myClientAccount == nil {
                    Button(action: { showingClientAccountDialog = true }) {
                        Label("Add", systemImage: "plus.circle.fill")
                            .font(.caption)
                    }
                    .buttonStyle(.plain)
                    .foregroundColor(.blue)
                }
            }
            
            if appState.clientAccounts.isEmpty {
                Text("No one is using client accounts")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding()
            } else {
                VStack(spacing: 8) {
                    ForEach(appState.clientAccounts) { clientAccount in
                        ClientAccountRow(clientAccount: clientAccount)
                    }
                }
            }
        }
    }
    
    private var pendingRequestsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Pending Requests")
                .font(.headline)
            
            VStack(spacing: 8) {
                ForEach(appState.pendingRequestForCurrentUser) { request in
                    AccessRequestRow(request: request)
                }
            }
        }
    }
    
    private var clientAccountDialog: some View {
        VStack(spacing: 20) {
            Text("Add Client Account")
                .font(.headline)
            
            TextField("Client Name", text: $clientNameInput)
                .textFieldStyle(.roundedBorder)
            
            HStack {
                Button("Cancel") {
                    showingClientAccountDialog = false
                    clientNameInput = ""
                }
                .buttonStyle(.bordered)
                
                Spacer()
                
                Button("Add") {
                    Task {
                        await appState.setClientAccount(clientNameInput)
                        showingClientAccountDialog = false
                        clientNameInput = ""
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(clientNameInput.isEmpty)
            }
        }
        .padding()
        .frame(width: 300)
    }
    
    private var addAccountDialog: some View {
        VStack(spacing: 20) {
            Text("Add Internal Account Slot")
                .font(.headline)
                .onAppear {
                    print("🟢 Add Account Dialog appeared!")
                }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Account Number")
                    .font(.caption)
                    .foregroundColor(.secondary)
                TextField("e.g., 1, 2, 3...", text: $newAccountNumber)
                    .textFieldStyle(.roundedBorder)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Label (Optional)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                TextField("e.g., Marketing, Design, Dev...", text: $newAccountLabel)
                    .textFieldStyle(.roundedBorder)
            }
            
            if !newAccountNumber.isEmpty {
                Text("Will create: \(newAccountNumber)\(!newAccountLabel.isEmpty ? " - \(newAccountLabel)" : "")")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            HStack {
                Button("Cancel") {
                    showingAddAccountDialog = false
                    newAccountNumber = ""
                    newAccountLabel = ""
                }
                .buttonStyle(.bordered)
                
                Spacer()
                
                Button("Create") {
                    Task {
                        await createNewAccountSlot()
                        showingAddAccountDialog = false
                        newAccountNumber = ""
                        newAccountLabel = ""
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(newAccountNumber.isEmpty)
            }
        }
        .padding()
        .frame(width: 300)
    }
    
    private func createNewAccountSlot() async {
        let accountId = "account\(newAccountNumber)"
        let label = newAccountLabel.isEmpty ? nil : newAccountLabel
        print("🟡 Creating account slot: \(accountId) with label: \(label ?? "none")")
        do {
            try await FirebaseService.shared.createAccountSlot(accountId: accountId, label: label)
            print("✅ Account slot created successfully: \(accountId)")
            print("✅ Check Firebase to verify it exists")
        } catch {
            print("❌ Error creating account slot: \(error)")
        }
    }
}

// MARK: - Account Row

struct AccountRow: View {
    let account: Account
    @StateObject private var appState = AppState.shared
    
    var body: some View {
        HStack(spacing: 12) {
            // Status Indicator
            Circle()
                .fill(statusColor)
                .frame(width: 12, height: 12)
            
            VStack(alignment: .leading, spacing: 2) {
                let accountTitle = account.label ?? account.id.replacingOccurrences(of: "account", with: "Internal Account ")
                Text(accountTitle)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let userName = account.userName, !userName.isEmpty {
                    Text("Used by \(userName)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    // Timer display
                    if !account.duration.isEmpty {
                        TimelineView(.periodic(from: Date(), by: 60)) { _ in
                            Text(account.duration)
                                .font(.caption2)
                                .foregroundColor(.blue)
                        }
                    }
                } else {
                    Text("Available")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }
            
            Spacer()
            
            // Action Buttons
            HStack(spacing: 8) {
                // Release button - for current user
                if isMyAccount {
                    Button("Release") {
                        Task {
                            await appState.releaseAccount()
                        }
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }
                // Claim button - for available accounts when user doesn't have one
                else if account.isAvailable && appState.myInternalAccount == nil {
                    Button("Claim") {
                        Task {
                            await appState.claimAccount(account)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                }
                // Request button - for occupied accounts when user doesn't have one
                else if !account.isAvailable && appState.myInternalAccount == nil {
                    Button("Request") {
                        Task {
                            await appState.requestAccess(to: account)
                        }
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .disabled(hasActiveRequest)
                }
                
                // Admin Delete button - always visible to admin
                if isAdmin {
                    Button(action: {
                        Task {
                            await deleteAccount()
                        }
                    }) {
                        Image(systemName: "trash")
                            .foregroundColor(.red)
                    }
                    .buttonStyle(.plain)
                    .help("Delete this account slot (admin only)")
                }
            }
        }
        .padding()
        .background(Color(.controlBackgroundColor))
        .cornerRadius(8)
    }
    
    private var statusColor: Color {
        if account.isAvailable {
            return .green
        } else if hasActiveRequest {
            return .yellow
        } else {
            return .red
        }
    }
    
    private var isMyAccount: Bool {
        guard let userId = appState.currentUser?.id else { return false }
        return account.userId == userId
    }
    
    private var hasActiveRequest: Bool {
        guard let userId = appState.currentUser?.id else { return false }
        return appState.accessRequests.contains { 
            $0.targetAccountId == account.id && $0.requesterId == userId && $0.status == .pending
        }
    }
    
    private var isAdmin: Bool {
        guard let userId = appState.currentUser?.id else { return false }
        return userId == "ADF18B6F-B4C5-4F77-82B4-B34BACEB2BFB" // Saurabh's ID
    }
    
    private func deleteAccount() async {
        do {
            try await FirebaseService.shared.deleteAccountSlot(account.id)
            print("🗑️ Deleted account slot: \(account.id)")
        } catch {
            print("❌ Error deleting account: \(error)")
        }
    }
}

// MARK: - Client Account Row

struct ClientAccountRow: View {
    let clientAccount: ClientAccount
    @StateObject private var appState = AppState.shared
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color.purple)
                .frame(width: 12, height: 12)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(clientAccount.clientName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let userName = clientAccount.userName {
                    Text("\(userName) • \(clientAccount.duration)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            if isMyAccount {
                Button("Clear") {
                    Task {
                        await appState.clearClientAccount()
                    }
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
        }
        .padding()
        .background(Color(.controlBackgroundColor))
        .cornerRadius(8)
    }
    
    private var isMyAccount: Bool {
        guard let userId = appState.currentUser?.id else { return false }
        return clientAccount.id == userId
    }
}

// MARK: - Access Request Row

struct AccessRequestRow: View {
    let request: AccessRequest
    @StateObject private var appState = AppState.shared
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "exclamationmark.circle.fill")
                    .foregroundColor(.orange)
                
                Text("\(request.requesterName) requests \(request.targetAccountId)")
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            
            HStack {
                Button("Release") {
                    Task {
                        await appState.releaseAccountForRequest(request)
                    }
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
                
                Button("Reject") {
                    Task {
                        await appState.rejectRequest(request.id)
                    }
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
        }
        .padding()
        .background(Color.orange.opacity(0.1))
        .cornerRadius(8)
    }
}

#Preview {
    DashboardView()
}
