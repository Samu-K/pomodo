import ActivityKit
import Foundation

// Assuming PomodoAttributes is shared and accessible.
// Since it's in a separate target/bundle, we need to ensure this file can see it.
// In the project.yml, both targets should have access to the file defining attributes.
// OR we import the Widget module if possible, but usually we just share the file.

@available(iOS 16.1, *)
@objc(LiveActivityManager)
class LiveActivityManager: NSObject {
    @objc static let shared = LiveActivityManager()
    
    private var currentActivity: Activity<PomodoAttributes>?
    
    @objc func start(expiryDate: Double, mode: String, completedCycles: Int, totalCyclesForLongRest: Int) {
        // End existing activity if any
        if let currentActivity = currentActivity {
             Task {
                await currentActivity.end(nil, dismissalPolicy: .immediate)
             }
        }
        
        let date = Date(timeIntervalSince1970: expiryDate)
        
        let attributes = PomodoAttributes()
        let contentState = PomodoAttributes.ContentState(
            expiryDate: date,
            mode: mode,
            completedCycles: completedCycles,
            totalCyclesForLongRest: totalCyclesForLongRest
        )
        
        // Stale date could be expiry date?
        let activityContent = ActivityContent(state: contentState, staleDate: date)
        
        do {
            currentActivity = try Activity.request(
                attributes: attributes,
                content: activityContent,
                pushType: nil // No push tokens for now
            )
            print("Live Activity Started: \(currentActivity?.id ?? "")")
        } catch {
            print("Error starting live activity: \(error.localizedDescription)")
        }
    }
    
    @objc func update(expiryDate: Double, mode: String, completedCycles: Int) {
        guard let activity = currentActivity else { return }
        
        var newState = activity.content.state
        // Check for sentinel values since we can't easily pass nil from ObjC primitives
        if mode != "" { newState.mode = mode }
        if completedCycles >= 0 { newState.completedCycles = completedCycles }
        if expiryDate > 0 { newState.expiryDate = Date(timeIntervalSince1970: expiryDate) }
        
        let content = ActivityContent(state: newState, staleDate: nil)
        
        Task {
            await activity.update(content)
        }
    }
    
    @objc func end() {
        guard let activity = currentActivity else { return }
        
        Task {
            await activity.end(nil, dismissalPolicy: .immediate)
            self.currentActivity = nil
        }
    }
}
