import Foundation
import SwiftUI
import Combine

@MainActor
class AppState: ObservableObject {
    static let shared = AppState()
    
    @Published var accounts: [Account] = []
    @Published var clientAccounts: [ClientAccount] = []
    @Published var users: [User] = []
    @Published var accessRequests: [AccessRequest] = []
    @Published var isConnected = false
    
    @Published var showingAccessRequestDialog = false
    @Published var selectedAccount: Account?
    @Published var pendingRequestForCurrentUser: [AccessRequest] = []
    
    private var cancellables = Set<AnyCancellable>()
    private let firebaseService = FirebaseService.shared
    private let authService = AuthService.shared
    private let notificationService = NotificationService.shared
    
    var currentUser: User? {
        authService.currentUser
    }
    
    var myInternalAccount: Account? {
        guard let userId = currentUser?.id else { return nil }
        return accounts.first { $0.userId == userId }
    }
    
    var myClientAccount: ClientAccount? {
        guard let userId = currentUser?.id else { return nil }
        return clientAccounts.first { $0.id == userId }
    }
    
    var availableAccounts: [Account] {
        accounts.filter { $0.isAvailable }
    }
    
    private init() {
        setupBindings()
        setupNotificationHandlers()
    }
    
    private func setupBindings() {
        firebaseService.$accounts
            .receive(on: DispatchQueue.main)
            .assign(to: &$accounts)
        
        firebaseService.$clientAccounts
            .receive(on: DispatchQueue.main)
            .assign(to: &$clientAccounts)
        
        firebaseService.$users
            .receive(on: DispatchQueue.main)
            .assign(to: &$users)
        
        firebaseService.$isConnected
            .receive(on: DispatchQueue.main)
            .assign(to: &$isConnected)
        
        firebaseService.$accessRequests
            .receive(on: DispatchQueue.main)
            .sink { [weak self] requests in
                self?.handleAccessRequests(requests)
            }
            .store(in: &cancellables)
    }
    
    private func setupNotificationHandlers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleReleaseNotification),
            name: NSNotification.Name("HandleAccessRequestRelease"),
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRejectNotification),
            name: NSNotification.Name("HandleAccessRequestReject"),
            object: nil
        )
    }
    
    private func handleAccessRequests(_ requests: [AccessRequest]) {
        guard let userId = currentUser?.id else { return }
        
        // Filter requests for current user that are still pending
        let myRequests = requests.filter { $0.currentUserId == userId && $0.status == .pending }
        
        // Find requests that were pending but are now fulfilled/rejected (notification cleanup)
        let previousRequestIds = Set(pendingRequestForCurrentUser.map { $0.id })
        let currentRequestIds = Set(myRequests.map { $0.id })
        let fulfilledOrRejectedIds = previousRequestIds.subtracting(currentRequestIds)
        
        // Cancel notifications for requests that are no longer pending
        for requestId in fulfilledOrRejectedIds {
            notificationService.cancelNotification(requestId: requestId)
            print("🔔 Cancelled notification for request: \(requestId)")
        }
        
        // Send notifications for new requests
        for request in myRequests {
            if !pendingRequestForCurrentUser.contains(where: { $0.id == request.id }) {
                // Find the account to get its label
                let account = accounts.first { $0.id == request.targetAccountId }
                let accountName = account?.label ?? request.targetAccountId.replacingOccurrences(of: "account", with: "Internal Account ")
                
                notificationService.sendAccessRequestNotification(
                    requesterName: request.requesterName,
                    accountName: accountName,
                    requestId: request.id
                )
            }
        }
        
        pendingRequestForCurrentUser = myRequests
        accessRequests = requests
    }
    
    @objc private func handleReleaseNotification(_ notification: Notification) {
        guard let requestId = notification.userInfo?["requestId"] as? String,
              let request = accessRequests.first(where: { $0.id == requestId }) else {
            return
        }
        
        Task {
            await releaseAccountForRequest(request)
        }
    }
    
    @objc private func handleRejectNotification(_ notification: Notification) {
        guard let requestId = notification.userInfo?["requestId"] as? String else {
            return
        }
        
        Task {
            await rejectRequest(requestId)
        }
    }
    
    // MARK: - Account Management
    
    func claimAccount(_ account: Account) async {
        guard let user = currentUser else { return }
        
        do {
            try await firebaseService.claimAccount(account.id, user: user)
        } catch {
            print("Error claiming account: \(error)")
        }
    }
    
    func releaseAccount() async {
        guard let account = myInternalAccount else { return }
        
        do {
            try await firebaseService.releaseAccount(account.id)
        } catch {
            print("Error releasing account: \(error)")
        }
    }
    
    // MARK: - Client Account Management
    
    func setClientAccount(_ clientName: String) async {
        guard let user = currentUser else { return }
        
        do {
            try await firebaseService.setClientAccount(clientName, user: user)
        } catch {
            print("Error setting client account: \(error)")
        }
    }
    
    func clearClientAccount() async {
        guard let userId = currentUser?.id else { return }
        
        do {
            try await firebaseService.clearClientAccount(userId: userId)
        } catch {
            print("Error clearing client account: \(error)")
        }
    }
    
    // MARK: - Access Requests
    
    func requestAccess(to account: Account) async {
        guard let user = currentUser,
              let currentUserId = account.userId,
              let currentUserName = account.userName else { return }
        
        let request = AccessRequest(
            requesterId: user.id,
            requesterName: user.name,
            targetAccountId: account.id,
            currentUserId: currentUserId,
            currentUserName: currentUserName
        )
        
        do {
            try await firebaseService.createAccessRequest(request)
        } catch {
            print("Error creating access request: \(error)")
        }
    }
    
    func releaseAccountForRequest(_ request: AccessRequest) async {
        do {
            try await firebaseService.releaseAccount(request.targetAccountId)
            try await firebaseService.updateAccessRequestStatus(requestId: request.id, status: .approved)
            notificationService.cancelNotification(requestId: request.id)
        } catch {
            print("Error releasing account: \(error)")
        }
    }
    
    func rejectRequest(_ requestId: String) async {
        do {
            try await firebaseService.updateAccessRequestStatus(requestId: requestId, status: .rejected)
            notificationService.cancelNotification(requestId: requestId)
        } catch {
            print("Error rejecting request: \(error)")
        }
    }
    
    func cancelRequest(_ requestId: String) async {
        do {
            try await firebaseService.deleteAccessRequest(requestId: requestId)
        } catch {
            print("Error cancelling request: \(error)")
        }
    }
}
