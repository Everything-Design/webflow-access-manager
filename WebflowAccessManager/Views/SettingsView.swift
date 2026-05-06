import SwiftUI

struct SettingsView: View {
    @StateObject private var authService = AuthService.shared
    @StateObject private var appState = AppState.shared
    @State private var userName = ""
    @State private var selectedIcon = "person.circle.fill"
    @State private var selectedColor = "0066CC"
    @State private var launchAtLogin = false
    @Environment(\.dismiss) var dismiss
    
    // Available profile icons
    private let availableIcons = [
        "person.circle.fill",
        "person.fill",
        "star.fill",
        "heart.fill",
        "bolt.fill",
        "flame.fill",
        "moon.fill",
        "sun.max.fill",
        "cloud.fill",
        "leaf.fill",
        "sparkles",
        "crown.fill"
    ]
    
    // Available profile colors (hex codes)
    private let availableColors = [
        ("Blue", "0066CC"),
        ("Purple", "7C3AED"),
        ("Pink", "EC4899"),
        ("Red", "EF4444"),
        ("Orange", "F97316"),
        ("Yellow", "EAB308"),
        ("Green", "10B981"),
        ("Teal", "14B8A6"),
        ("Indigo", "6366F1"),
        ("Gray", "6B7280")
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                HStack {
                    Text("Settings")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Spacer()
                }
                
                Divider()
                
                // User Profile
                VStack(alignment: .leading, spacing: 16) {
                    Text("Profile")
                        .font(.headline)
                    
                    // Profile Preview
                    HStack(spacing: 16) {
                        // Profile Icon with Color
                        Image(systemName: selectedIcon)
                            .font(.system(size: 50))
                            .foregroundColor(Color(hex: selectedColor) ?? .blue)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Name")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            TextField("Your Name", text: $userName)
                                .textFieldStyle(.roundedBorder)
                            
                            if let user = authService.currentUser {
                                Text(user.deviceId)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    
                    // Icon Selection
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Profile Icon")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 50))], spacing: 12) {
                            ForEach(availableIcons, id: \.self) { icon in
                                Button(action: {
                                    selectedIcon = icon
                                }) {
                                    Image(systemName: icon)
                                        .font(.system(size: 24))
                                        .foregroundColor(selectedIcon == icon ? Color(hex: selectedColor) : .secondary)
                                        .frame(width: 50, height: 50)
                                        .background(
                                            RoundedRectangle(cornerRadius: 8)
                                                .fill(selectedIcon == icon ? Color(hex: selectedColor)?.opacity(0.1) ?? Color.blue.opacity(0.1) : Color.clear)
                                        )
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 8)
                                                .stroke(selectedIcon == icon ? Color(hex: selectedColor) ?? .blue : Color.gray.opacity(0.3), lineWidth: selectedIcon == icon ? 2 : 1)
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    
                    // Color Selection
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Profile Color")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 60))], spacing: 12) {
                            ForEach(availableColors, id: \.1) { colorName, colorHex in
                                Button(action: {
                                    selectedColor = colorHex
                                }) {
                                    VStack(spacing: 4) {
                                        Circle()
                                            .fill(Color(hex: colorHex) ?? .blue)
                                            .frame(width: 32, height: 32)
                                            .overlay(
                                                Circle()
                                                    .stroke(selectedColor == colorHex ? .primary : Color.clear, lineWidth: 2)
                                            )
                                        
                                        Text(colorName)
                                            .font(.caption2)
                                            .foregroundColor(.secondary)
                                    }
                                    .frame(width: 60)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                
                Divider()
                
                // Preferences
                VStack(alignment: .leading, spacing: 12) {
                    Text("Preferences")
                        .font(.headline)
                    
                    Toggle("Launch at Login", isOn: $launchAtLogin)
                        .onChange(of: launchAtLogin) { newValue in
                            setLaunchAtLogin(newValue)
                        }
                        .onAppear {
                            launchAtLogin = getLaunchAtLoginStatus()
                        }
                }
                
                Divider()
                
                // Status
                VStack(alignment: .leading, spacing: 12) {
                    Text("Connection")
                        .font(.headline)
                    
                    HStack {
                        Circle()
                            .fill(appState.isConnected ? Color.green : Color.red)
                            .frame(width: 10, height: 10)
                        
                        Text(appState.isConnected ? "Connected to Firebase" : "Disconnected")
                            .font(.subheadline)
                        
                        Spacer()
                    }
                }
                
                Spacer()
                
                // Actions
                VStack(spacing: 12) {
                    Button(action: saveChanges) {
                        Text("Save Changes")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(userName.isEmpty)
                    
                    Button(action: signOut) {
                        Text("Sign Out")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding()
        }
        .frame(width: 450, height: 650)
        .onAppear {
            if let user = authService.currentUser {
                userName = user.name
                selectedIcon = user.profileIcon ?? "person.circle.fill"
                selectedColor = user.profileColor ?? "0066CC"
            }
        }
    }
    
    private func saveChanges() {
        Task {
            do {
                try await authService.updateUser(
                    name: userName.trimmingCharacters(in: .whitespaces),
                    profileIcon: selectedIcon,
                    profileColor: selectedColor
                )
                dismiss()
            } catch {
                print("Failed to update user: \(error)")
            }
        }
    }
    
    private func signOut() {
        Task {
            do {
                try await authService.signOut()
                dismiss()
            } catch {
                print("Failed to sign out: \(error)")
            }
        }
    }
    
    private func setLaunchAtLogin(_ enabled: Bool) {
        // This would require SMLoginItemSetEnabled or ServiceManagement framework
        // For now, just save the preference
        UserDefaults.standard.set(enabled, forKey: "launchAtLogin")
    }
    
    private func getLaunchAtLoginStatus() -> Bool {
        UserDefaults.standard.bool(forKey: "launchAtLogin")
    }
}

// MARK: - Color Extension for Hex Support

extension Color {
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }
        
        let r = Double((rgb & 0xFF0000) >> 16) / 255.0
        let g = Double((rgb & 0x00FF00) >> 8) / 255.0
        let b = Double(rgb & 0x0000FF) / 255.0
        
        self.init(red: r, green: g, blue: b)
    }
}

#Preview {
    SettingsView()
}
