self.onmessage = (e: MessageEvent) => {
	const { type, payload } = e.data;

	if (type === "START") {
		const { endTime } = payload;
		startTimer(endTime);
	} else if (type === "PAUSE") {
		pauseTimer();
	}
};

let intervalId: number | undefined;

function startTimer(endTime: number) {
	if (intervalId) clearInterval(intervalId);

	intervalId = self.setInterval(() => {
		const now = Date.now();
		const diff = Math.ceil((endTime - now) / 1000);

		if (diff <= 0) {
			self.postMessage({ type: "COMPLETE" });
			pauseTimer();
		} else {
			self.postMessage({ type: "TICK", payload: { remainingTime: diff } });
		}
	}, 100);
}

function pauseTimer() {
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = undefined;
	}
}
