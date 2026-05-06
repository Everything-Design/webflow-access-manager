import Foundation

enum AccessRequestStatus: String, Codable {
    case pending
    case approved
    case rejected
    case cancelled
}

struct AccessRequest: Identifiable, Codable, Equatable {
    var id: String
    var requesterId: String
    var requesterName: String
    var targetAccountId: String
    var currentUserId: String
    var currentUserName: String
    var status: AccessRequestStatus
    var timestamp: Date
    
    enum CodingKeys: String, CodingKey {
        case requesterId
        case requesterName
        case targetAccountId
        case currentUserId
        case currentUserName
        case status
        case timestamp
    }
    
    init(id: String = UUID().uuidString,
         requesterId: String,
         requesterName: String,
         targetAccountId: String,
         currentUserId: String,
         currentUserName: String,
         status: AccessRequestStatus = .pending,
         timestamp: Date = Date()) {
        self.id = id
        self.requesterId = requesterId
        self.requesterName = requesterName
        self.targetAccountId = targetAccountId
        self.currentUserId = currentUserId
        self.currentUserName = currentUserName
        self.status = status
        self.timestamp = timestamp
    }
    
    init(from decoder: Decoder) throws {
        self.id = ""
        
        let container = try decoder.container(keyedBy: CodingKeys.self)
        requesterId = try container.decode(String.self, forKey: .requesterId)
        requesterName = try container.decode(String.self, forKey: .requesterName)
        targetAccountId = try container.decode(String.self, forKey: .targetAccountId)
        currentUserId = try container.decode(String.self, forKey: .currentUserId)
        currentUserName = try container.decode(String.self, forKey: .currentUserName)
        status = try container.decode(AccessRequestStatus.self, forKey: .status)
        
        if let timestampValue = try? container.decode(TimeInterval.self, forKey: .timestamp) {
            self.timestamp = Date(timeIntervalSince1970: timestampValue / 1000)
        } else {
            self.timestamp = Date()
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(requesterId, forKey: .requesterId)
        try container.encode(requesterName, forKey: .requesterName)
        try container.encode(targetAccountId, forKey: .targetAccountId)
        try container.encode(currentUserId, forKey: .currentUserId)
        try container.encode(currentUserName, forKey: .currentUserName)
        try container.encode(status, forKey: .status)
        try container.encode(timestamp.timeIntervalSince1970 * 1000, forKey: .timestamp)
    }
}
