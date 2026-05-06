import SwiftUI

struct OnboardingView: View {
    @StateObject private var authService = AuthService.shared
    @State private var userName = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack(spacing: 24) {
            // Logo/Icon
            Image(systemName: "person.3.fill")
                .font(.system(size: 60))
                .foregroundStyle(.blue.gradient)
                .padding(.top, 40)
            
            VStack(spacing: 12) {
                Text("Welcome to Webflow Access Manager")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Coordinate Webflow account access with your team")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Spacer()
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Your Name")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                TextField("Enter your name", text: $userName)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit {
                        signIn()
                    }
            }
            .padding(.horizontal, 40)
            
            if let errorMessage = errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
            }
            
            Spacer()
            
            Button(action: signIn) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .controlSize(.small)
                        .frame(maxWidth: .infinity)
                } else {
                    Text("Get Started")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(userName.isEmpty || isLoading)
            .padding(.horizontal, 40)
            .padding(.bottom, 40)
        }
        .frame(width: 400, height: 500)
    }
    
    private func signIn() {
        guard !userName.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Please enter your name"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                print("🔐 Attempting to sign in with name: \(userName)")
                try await authService.signIn(name: userName.trimmingCharacters(in: .whitespaces))
                print("✅ Sign in successful!")
                await MainActor.run {
                    isLoading = false
                }
            } catch {
                print("❌ Sign in failed: \(error)")
                await MainActor.run {
                    errorMessage = "Failed to sign in: \(error.localizedDescription)"
                    isLoading = false
                }
            }
        }
    }
}

#Preview {
    OnboardingView()
}
