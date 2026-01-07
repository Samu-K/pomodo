import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

@available(iOS 16.1, *)
struct PomodoLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: PomodoAttributes.self) { context in
      // Lock Screen / Banner UI
      VStack(spacing: 0) {
        HStack(alignment: .center) {
          // Top Left: Mode
          VStack(alignment: .leading) {
              Text(context.state.mode)
                  .font(.headline)
                  .foregroundColor(.orange) // Pomodo/Orange
          }
            
          Spacer()
            
          // Center: Timer
          Text(timerInterval: Date.now...context.state.expiryDate, countsDown: true)
             .multilineTextAlignment(.center)
             .monospacedDigit()
             .font(.system(size: 40, weight: .bold))
             .foregroundColor(.orange)
            
          Spacer()
            
          // Bottom Right: End Button (Placeholder spacing)
          // We'll place it in the row below or integrated here depending on layout
        }
        .padding(.horizontal)
        .padding(.top)

        HStack {
            // Bottom Left: Long Rest Progress
            HStack(spacing: 6) {
                ForEach(0..<context.state.totalCyclesForLongRest, id: \.self) { index in
                    Circle()
                        .fill(index < context.state.completedCycles ? Color.orange : Color.gray.opacity(0.3))
                        .frame(width: 12, height: 12)
                }
            }
            
            Spacer()
            
            // Bottom Right: End Button
             Button(intent: EndSessionIntent()) {
                Text("End")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
                    .background(Color.orange) // Todo: Match user's brown/orange theme
                    .cornerRadius(20)
            }
        }
        .padding()
      }
      .activityBackgroundTint(Color.black.opacity(0.8))
      .activitySystemActionForegroundColor(Color.orange)

    } dynamicIsland: { context in
      DynamicIsland {
        // Expanded UI
        DynamicIslandExpandedRegion(.leading) {
           Image(systemName: "timer") // Placeholder for Pomodo Logo
                .foregroundColor(.orange)
        }
        DynamicIslandExpandedRegion(.trailing) {
             Text(timerInterval: Date.now...context.state.expiryDate, countsDown: true)
                .monospacedDigit()
                .font(.headline)
                .foregroundColor(.orange)
        }
        DynamicIslandExpandedRegion(.bottom) {
             // Optional: Show cycles or End button here too
             HStack {
                  HStack(spacing: 4) {
                    ForEach(0..<context.state.totalCyclesForLongRest, id: \.self) { index in
                        Circle()
                            .fill(index < context.state.completedCycles ? Color.orange : Color.gray.opacity(0.3))
                            .frame(width: 8, height: 8)
                    }
                }
                Spacer()
                Button(intent: EndSessionIntent()) {
                    Text("End").font(.caption).bold()
                }
             }
        }
      } compactLeading: {
         Image(systemName: "timer") // Placeholder for Pomodo Logo
            .foregroundColor(.orange)
      } compactTrailing: {
         Text(timerInterval: Date.now...context.state.expiryDate, countsDown: true)
            .monospacedDigit()
            .font(.caption)
            .foregroundColor(.orange)
      } minimal: {
         Image(systemName: "timer")
            .foregroundColor(.orange)
      }
    }
  }
}
