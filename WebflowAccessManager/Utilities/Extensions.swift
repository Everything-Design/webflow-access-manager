import SwiftUI

extension Color {
    static let customGreen = Color(red: 0.2, green: 0.8, blue: 0.4)
    static let customRed = Color(red: 0.9, green: 0.3, blue: 0.3)
    static let customYellow = Color(red: 0.95, green: 0.8, blue: 0.2)
    static let customPurple = Color(red: 0.7, green: 0.4, blue: 0.9)
}

extension View {
    func hideWindowControls() -> some View {
        self.onAppear {
            if let window = NSApplication.shared.windows.first {
                window.standardWindowButton(.closeButton)?.isHidden = false
                window.standardWindowButton(.miniaturizeButton)?.isHidden = false
                window.standardWindowButton(.zoomButton)?.isHidden = true
            }
        }
    }
}
