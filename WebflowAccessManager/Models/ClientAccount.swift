import Foundation

struct ClientAccount: Identifiable, Codable, Equatable {
    var id: String // userId
    var clientName: String
    var since: Date
    var userName: String?
    
    enum CodingKeys: String, CodingKey {
        case clientName
        case since
        case userName
    }
    
    init(id: String, clientName: String, since: Date = Date(), userName: String? = nil) {
        self.id = id
        self.clientName = clientName
        self.since = since
        self.userName = userName
    }
    
    init(from decoder: Decoder) throws {
        self.id = ""
        
        let container = try decoder.container(keyedBy: CodingKeys.self)
        clientName = try container.decode(String.self, forKey: .clientName)
        userName = try container.decodeIfPresent(String.self, forKey: .userName)
        
        if let timestampValue = try? container.decode(TimeInterval.self, forKey: .since) {
            since = Date(timeIntervalSince1970: timestampValue / 1000)
        } else {
            since = Date()
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(clientName, forKey: .clientName)
        try container.encode(since.timeIntervalSince1970 * 1000, forKey: .since)
        try container.encodeIfPresent(userName, forKey: .userName)
    }
    
    var duration: String {
        let interval = Date().timeIntervalSince(since)
        let hours = Int(interval / 3600)
        let minutes = Int((interval.truncatingRemainder(dividingBy: 3600)) / 60)
        
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}
