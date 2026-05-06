import Foundation

struct User: Identifiable, Codable, Equatable {
    var id: String
    var name: String
    var deviceId: String
    var online: Bool
    var lastSeen: Date
    var profileImageURL: String?
    var profileIcon: String? // SF Symbol name
    var profileColor: String? // Hex color code
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case deviceId
        case online
        case lastSeen
        case profileImageURL
        case profileIcon
        case profileColor
    }
    
    init(id: String = UUID().uuidString, 
         name: String, 
         deviceId: String, 
         online: Bool = true, 
         lastSeen: Date = Date(),
         profileImageURL: String? = nil,
         profileIcon: String? = nil,
         profileColor: String? = nil) {
        self.id = id
        self.name = name
        self.deviceId = deviceId
        self.online = online
        self.lastSeen = lastSeen
        self.profileImageURL = profileImageURL
        self.profileIcon = profileIcon
        self.profileColor = profileColor
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        deviceId = try container.decode(String.self, forKey: .deviceId)
        online = try container.decodeIfPresent(Bool.self, forKey: .online) ?? false
        
        if let timestamp = try? container.decode(TimeInterval.self, forKey: .lastSeen) {
            lastSeen = Date(timeIntervalSince1970: timestamp / 1000)
        } else {
            lastSeen = Date()
        }
        
        profileImageURL = try container.decodeIfPresent(String.self, forKey: .profileImageURL)
        profileIcon = try container.decodeIfPresent(String.self, forKey: .profileIcon)
        profileColor = try container.decodeIfPresent(String.self, forKey: .profileColor)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(deviceId, forKey: .deviceId)
        try container.encode(online, forKey: .online)
        try container.encode(lastSeen.timeIntervalSince1970 * 1000, forKey: .lastSeen)
        try container.encodeIfPresent(profileImageURL, forKey: .profileImageURL)
        try container.encodeIfPresent(profileIcon, forKey: .profileIcon)
        try container.encodeIfPresent(profileColor, forKey: .profileColor)
    }
}
