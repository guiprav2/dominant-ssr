/**
 * Mutation Observer Listener.
 */
export default class MutationObserverListener {
    target;
    options;
    mutationListener;
    #window;
    #observer;
    #callback;
    #records = [];
    #destroyed = false;
    #microtaskQueued = false;
    /**
     * Constructor.
     *
     * @param init Options.
     * @param init.window Window.
     * @param init.options Options.
     * @param init.target Target.
     * @param init.observer Observer.
     * @param init.callback Callback.
     */
    constructor(init) {
        this.options = init.options;
        this.target = init.target;
        this.mutationListener = {
            options: init.options,
            callback: new WeakRef((record) => this.report(record))
        };
        this.#window = init.window;
        this.#observer = init.observer;
        this.#callback = init.callback;
    }
    /**
     * Reports mutations.
     *
     * @param record Record.
     */
    report(record) {
        if (this.#destroyed) {
            return;
        }
        this.#records.push(record);
        if (this.#microtaskQueued) {
            return;
        }
        this.#microtaskQueued = true;
        this.#window.queueMicrotask(() => {
            this.#microtaskQueued = false;
            if (this.#destroyed) {
                return;
            }
            const records = this.#records;
            if (records?.length > 0) {
                this.#records = [];
                this.#callback(records, this.#observer);
            }
        });
    }
    /**
     * Destroys the listener.
     */
    takeRecords() {
        if (this.#destroyed) {
            return [];
        }
        const records = this.#records;
        this.#records = [];
        return records;
    }
    /**
     * Destroys the listener.
     */
    destroy() {
        if (this.#destroyed) {
            return;
        }
        this.#destroyed = true;
        this.options = null;
        this.target = null;
        this.mutationListener = null;
        this.#window = null;
        this.#observer = null;
        this.#callback = null;
        this.#microtaskQueued = false;
        this.#records = null;
    }
}
//# sourceMappingURL=MutationObserverListener.js.map
