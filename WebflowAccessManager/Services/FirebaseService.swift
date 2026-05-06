import Foundation
import FirebaseCore
import FirebaseDatabase
import Combine

class FirebaseService: ObservableObject {
    static let shared = FirebaseService()
    
    @Published var accounts: [Account] = []
    @Published var clientAccounts: [ClientAccount] = []
    @Published var users: [User] = []
    @Published var accessRequests: [AccessRequest] = []
    @Published var isConnected = false
    
    private lazy var database = Database.database().reference()
    private var accountsRef: DatabaseReference?
    private var clientAccountsRef: DatabaseReference?
    private var usersRef: DatabaseReference?
    private var accessRequestsRef: DatabaseReference?
    private var connectedRef: DatabaseReference?
    
    private var accountsHandle: DatabaseHandle?
    private var clientAccountsHandle: DatabaseHandle?
    private var usersHandle: DatabaseHandle?
    private var accessRequestsHandle: DatabaseHandle?
    
    private init() {
        setupConnectionListener()
    }
    
    deinit {
        removeListeners()
    }
    
    // MARK: - Setup
    
    private func setupConnectionListener() {
        connectedRef = Database.database().reference(withPath: ".info/connected")
        connectedRef?.observe(.value) { [weak self] snapshot in
            if let connected = snapshot.value as? Bool {
                self?.isConnected = connected
            }
        }
    }
    
    func setupListeners() {
        observeAccounts()
        observeClientAccounts()
        observeUsers()
        observeAccessRequests()
    }
    
    func removeListeners() {
        if let handle = accountsHandle {
            accountsRef?.removeObserver(withHandle: handle)
        }
        if let handle = clientAccountsHandle {
            clientAccountsRef?.removeObserver(withHandle: handle)
        }
        if let handle = usersHandle {
            usersRef?.removeObserver(withHandle: handle)
        }
        if let handle = accessRequestsHandle {
            accessRequestsRef?.removeObserver(withHandle: handle)
        }
    }
    
    // MARK: - Accounts
    
    private func observeAccounts() {
        accountsRef = database.child("accounts/internal")
        accountsHandle = accountsRef?.observe(.value) { [weak self] snapshot in
            guard let self = self else { return }
            var accountsList: [Account] = []
            
            for child in snapshot.children {
                if let snapshot = child as? DataSnapshot,
                   var account = try? snapshot.decode(Account.self) {
                    account.id = snapshot.key
                    accountsList.append(account)
                }
            }
            
            DispatchQueue.main.async {
                self.accounts = accountsList.sorted { $0.id < $1.id }
            }
        }
    }
    
    func claimAccount(_ accountId: String, user: User) async throws {
        // Use updateChildValues to preserve the label field
        let accountData: [String: Any] = [
            "userId": user.id,
            "userName": user.name,
            "deviceId": user.deviceId,
            "since": ServerValue.timestamp()
            // Note: label is NOT updated, so custom names persist!
        ]
        try await database.child("accounts/internal/\(accountId)").updateChildValues(accountData)
    }
    
    func releaseAccount(_ accountId: String) async throws {
        // Clear the account data but keep the slot AND the label
        // Only clear user-specific fields
        let accountData: [String: Any] = [
            "userId": "",
            "userName": "",
            "deviceId": "",
            "since": ""
            // Note: label is NOT cleared, so it persists!
        ]
        try await database.child("accounts/internal/\(accountId)").updateChildValues(accountData)
    }
    
    // Admin only - completely delete an account slot
    func deleteAccountSlot(_ accountId: String) async throws {
        try await database.child("accounts/internal/\(accountId)").removeValue()
    }
    
    // MARK: - Client Accounts
    
    private func observeClientAccounts() {
        clientAccountsRef = database.child("accounts/client")
        clientAccountsHandle = clientAccountsRef?.observe(.value) { [weak self] snapshot in
            guard let self = self else { return }
            var clientAccountsList: [ClientAccount] = []
            
            for child in snapshot.children {
                if let snapshot = child as? DataSnapshot,
                   var clientAccount = try? snapshot.decode(ClientAccount.self) {
                    clientAccount.id = snapshot.key
                    clientAccountsList.append(clientAccount)
                }
            }
            
            DispatchQueue.main.async {
                self.clientAccounts = clientAccountsList
            }
        }
    }
    
    func setClientAccount(_ clientName: String, user: User) async throws {
        let clientData: [String: Any] = [
            "clientName": clientName,
            "userName": user.name,
            "since": ServerValue.timestamp()
        ]
        try await database.child("accounts/client/\(user.id)").setValue(clientData)
    }
    
    func clearClientAccount(userId: String) async throws {
        try await database.child("accounts/client/\(userId)").removeValue()
    }
    
    // MARK: - Admin Functions
    
    func createAccountSlot(accountId: String, label: String? = nil) async throws {
        // Create account slot with empty string placeholders
        // Firebase won't accept completely empty objects, but the app treats empty strings as null
        var accountData: [String: Any] = [
            "userId": "",
            "userName": "",
            "deviceId": "",
            "since": ""
        ]
        
        // Add label if provided
        if let label = label, !label.isEmpty {
            accountData["label"] = label
        }
        
        try await database.child("accounts/internal/\(accountId)").setValue(accountData)
    }
    
    // MARK: - Users
    
    private func observeUsers() {
        usersRef = database.child("users")
        usersHandle = usersRef?.observe(.value) { [weak self] snapshot in
            guard let self = self else { return }
            var usersList: [User] = []
            
            for child in snapshot.children {
                if let snapshot = child as? DataSnapshot,
                   var user = try? snapshot.decode(User.self) {
                    user.id = snapshot.key
                    usersList.append(user)
                }
            }
            
            DispatchQueue.main.async {
                self.users = usersList
            }
        }
    }
    
    func registerUser(_ user: User) async throws {
        let userData: [String: Any] = [
            "id": user.id,
            "name": user.name,
            "deviceId": user.deviceId,
            "online": true,
            "lastSeen": ServerValue.timestamp()
        ]
        try await database.child("users/\(user.id)").setValue(userData)
        
        // Setup presence
        let presenceRef = database.child("presence/\(user.id)")
        try await presenceRef.setValue(true)
        _ = try await presenceRef.onDisconnectRemoveValue()
    }
    
    func updateUserPresence(userId: String, online: Bool) async throws {
        try await database.child("users/\(userId)/online").setValue(online)
        try await database.child("users/\(userId)/lastSeen").setValue(ServerValue.timestamp())
    }
    
    // MARK: - Access Requests
    
    private func observeAccessRequests() {
        accessRequestsRef = database.child("accessRequests")
        accessRequestsHandle = accessRequestsRef?.observe(.value) { [weak self] snapshot in
            guard let self = self else { return }
            var requestsList: [AccessRequest] = []
            
            for child in snapshot.children {
                if let snapshot = child as? DataSnapshot,
                   var request = try? snapshot.decode(AccessRequest.self) {
                    request.id = snapshot.key
                    requestsList.append(request)
                }
            }
            
            DispatchQueue.main.async {
                self.accessRequests = requestsList.filter { $0.status == .pending }
            }
        }
    }
    
    func createAccessRequest(_ request: AccessRequest) async throws {
        let requestData: [String: Any] = [
            "requesterId": request.requesterId,
            "requesterName": request.requesterName,
            "targetAccountId": request.targetAccountId,
            "currentUserId": request.currentUserId,
            "currentUserName": request.currentUserName,
            "status": request.status.rawValue,
            "timestamp": ServerValue.timestamp()
        ]
        try await database.child("accessRequests/\(request.id)").setValue(requestData)
    }
    
    func updateAccessRequestStatus(requestId: String, status: AccessRequestStatus) async throws {
        try await database.child("accessRequests/\(requestId)/status").setValue(status.rawValue)
    }
    
    func deleteAccessRequest(requestId: String) async throws {
        try await database.child("accessRequests/\(requestId)").removeValue()
    }
}

// MARK: - Helper Extension

extension DataSnapshot {
    func decode<T: Decodable>(_ type: T.Type) throws -> T {
        guard let value = self.value else {
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: [], debugDescription: "Snapshot value is nil")
            )
        }
        
        let data = try JSONSerialization.data(withJSONObject: value)
        return try JSONDecoder().decode(T.self, from: data)
    }
}
