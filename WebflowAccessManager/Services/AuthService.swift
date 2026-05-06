import Foundation
import SwiftUI
import Combine

class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    
    private let userDefaultsKey = "webflow_current_user"
    
    private init() {
        loadUser()
    }
    
    func loadUser() {
        if let data = UserDefaults.standard.data(forKey: userDefaultsKey),
           let user = try? JSONDecoder().decode(User.self, from: data) {
            self.currentUser = user
            self.isAuthenticated = true
        }
    }
    
    func signIn(name: String, profileImageURL: String? = nil, profileIcon: String? = nil, profileColor: String? = nil) async throws {
        let deviceId = getDeviceId()
        let user = User(
            name: name,
            deviceId: deviceId,
            profileImageURL: profileImageURL,
            profileIcon: profileIcon,
            profileColor: profileColor
        )
        
        // Save user to Firebase
        try await FirebaseService.shared.registerUser(user)
        
        // Save locally
        if let encoded = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(encoded, forKey: userDefaultsKey)
        }
        
        DispatchQueue.main.async {
            self.currentUser = user
            self.isAuthenticated = true
        }
    }
    
    func signOut() async throws {
        guard let user = currentUser else { return }
        
        // Update presence
        try await FirebaseService.shared.updateUserPresence(userId: user.id, online: false)
        
        // Clear local data
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
        
        DispatchQueue.main.async {
            self.currentUser = nil
            self.isAuthenticated = false
        }
    }
    
    func updateUser(name: String? = nil, profileImageURL: String? = nil, profileIcon: String? = nil, profileColor: String? = nil) async throws {
        guard var user = currentUser else { return }
        
        if let name = name {
            user.name = name
        }
        if let profileImageURL = profileImageURL {
            user.profileImageURL = profileImageURL
        }
        if let profileIcon = profileIcon {
            user.profileIcon = profileIcon
        }
        if let profileColor = profileColor {
            user.profileColor = profileColor
        }
        
        // Update in Firebase
        try await FirebaseService.shared.registerUser(user)
        
        // Update locally
        if let encoded = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(encoded, forKey: userDefaultsKey)
        }
        
        DispatchQueue.main.async {
            self.currentUser = user
        }
    }
    
    private func getDeviceId() -> String {
        if let deviceId = UserDefaults.standard.string(forKey: "device_id") {
            return deviceId
        }
        
        let deviceId = Host.current().localizedName ?? "Unknown Mac"
        UserDefaults.standard.set(deviceId, forKey: "device_id")
        return deviceId
    }
}
