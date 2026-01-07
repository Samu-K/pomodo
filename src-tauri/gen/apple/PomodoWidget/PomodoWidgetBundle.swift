import WidgetKit
import SwiftUI

@main
struct PomodoWidgetBundle: WidgetBundle {
  var body: some Widget {
    if #available(iOS 16.1, *) {
        PomodoLiveActivity()
    }
  }
}
