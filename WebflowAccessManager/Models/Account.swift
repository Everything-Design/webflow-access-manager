import Foundation

struct Account: Identifiable, Codable, Equatable {
    var id: String
    var userId: String?
    var userName: String?
    var deviceId: String?
    var since: Date?
    var label: String? // Custom label like "Marketing", "Design", etc.
    
    var isAvailable: Bool {
        // Account is available if userId is nil OR empty string
        return userId == nil || userId?.isEmpty == true
    }
    
    var duration: String {
        guard let since = since else { return "" }
        let interval = Date().timeIntervalSince(since)
        let hours = Int(interval / 3600)
        let minutes = Int((interval.truncatingRemainder(dividingBy: 3600)) / 60)
        
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case userId
        case userName
        case deviceId
        case since
        case label
    }
    
    init(id: String, userId: String? = nil, userName: String? = nil, deviceId: String? = nil, since: Date? = nil, label: String? = nil) {
        self.id = id
        self.userId = userId
        self.userName = userName
        self.deviceId = deviceId
        self.since = since
        self.label = label
    }
    
    init(from decoder: Decoder) throws {
        // ID will be set from Firebase key
        self.id = ""
        
        let container = try decoder.container(keyedBy: CodingKeys.self)
        userId = try container.decodeIfPresent(String.self, forKey: .userId)
        userName = try container.decodeIfPresent(String.self, forKey: .userName)
        deviceId = try container.decodeIfPresent(String.self, forKey: .deviceId)
        label = try container.decodeIfPresent(String.self, forKey: .label)
        
        if let timestamp = try? container.decodeIfPresent(TimeInterval.self, forKey: .since) {
            since = Date(timeIntervalSince1970: timestamp / 1000)
        } else {
            since = nil
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(userId, forKey: .userId)
        try container.encodeIfPresent(userName, forKey: .userName)
        try container.encodeIfPresent(deviceId, forKey: .deviceId)
        
        if let since = since {
            try container.encode(since.timeIntervalSince1970 * 1000, forKey: .since)
        } else {
            try container.encodeNil(forKey: .since)
        }
    }
}
