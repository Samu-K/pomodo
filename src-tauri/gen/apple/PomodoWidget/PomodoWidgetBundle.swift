import WidgetKit
import SwiftUI

@main
struct PomodoWidgetBundle: WidgetBundle {
  var body: some Widget {
    // Widget functionality removed
    EmptyWidgetConfiguration()
  }
}

struct EmptyWidgetConfiguration: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "EmptyWidget", provider: EmptyTimelineProvider()) { _ in
      EmptyView()
    }
    .configurationDisplayName("Pomodo")
    .description("Timer widget")
  }
}

struct EmptyTimelineProvider: TimelineProvider {
  func placeholder(in context: Context) -> SimpleEntry {
    SimpleEntry(date: Date())
  }
  
  func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
    completion(SimpleEntry(date: Date()))
  }
  
  func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> Void) {
    completion(Timeline(entries: [SimpleEntry(date: Date())], policy: .never))
  }
}

struct SimpleEntry: TimelineEntry {
  let date: Date
}
