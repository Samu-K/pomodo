import ActivityKit
import Foundation

public struct PomodoAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    // Dynamic state that changes over time
    public var expiryDate: Date
    public var mode: String // "Focus", "Short Break", "Long Break"
    public var completedCycles: Int
    public var totalCyclesForLongRest: Int
    
    public init(expiryDate: Date, mode: String, completedCycles: Int, totalCyclesForLongRest: Int) {
      self.expiryDate = expiryDate
      self.mode = mode
      self.completedCycles = completedCycles
      self.totalCyclesForLongRest = totalCyclesForLongRest
    }
  }

  // Fixed static data
  public init() {}
}
