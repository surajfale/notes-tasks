<script lang="ts">
  import { onMount } from 'svelte';
  import { notificationStore } from '$lib/stores/notifications';
  import type { IsoWeekday, ReminderFrequency, TaskReminder } from '$lib/types/task';
  import {
    MAX_REMINDERS,
    MAX_INTERVAL,
    WEEKDAYS,
    browserTimezone,
    describeChannels,
    describeRepeat,
    formatReminderTime,
    fromLocalInputs,
    isoWeekday,
    newReminder,
    toLocalInputs,
    upcomingAt,
    validateReminder
  } from '$lib/utils/reminders';
  import '$lib/components/tactile/neumorphic.css';

  /** The task's reminders; edited in place. */
  export let reminders: TaskReminder[] = [];
  /** Used to default a new reminder to the due date. */
  export let dueDate: Date | null = null;
  export let disabled = false;
  /** Per-reminder errors from the parent's submit-time validation, by index. */
  export let errors: Record<number, string> = {};

  let editingIndex: number | null = null;
  // Index of a reminder added but not yet confirmed; Cancel removes it.
  let unconfirmedIndex: number | null = null;
  let localErrors: Record<number, string> = {};

  $: allErrors = { ...errors, ...localErrors };
  $: accountEmailOn = $notificationStore.preferences?.emailNotificationsEnabled !== false;
  $: accountPushOn = Boolean($notificationStore.preferences?.browserNotificationsEnabled);

  const FREQUENCY_OPTIONS: { value: ReminderFrequency; label: string }[] = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'hourly', label: 'Every few hours' },
    { value: 'daily', label: 'Daily / every few days' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const UNIT_LABEL: Record<Exclude<ReminderFrequency, 'none'>, [string, string]> = {
    hourly: ['hour', 'hours'],
    daily: ['day', 'days'],
    weekly: ['week', 'weeks'],
    monthly: ['month', 'months']
  };

  onMount(() => {
    if (!$notificationStore.preferences) notificationStore.loadPreferences();
  });

  function update(index: number, changes: Partial<TaskReminder>) {
    // Any edit invalidates the server's computed schedule for display; the
    // server recomputes nextFireAt on save.
    reminders[index] = { ...reminders[index], ...changes, nextFireAt: undefined, timezone: browserTimezone() };
    reminders = reminders;
    delete localErrors[index];
    localErrors = localErrors;
  }

  function add() {
    if (reminders.length >= MAX_REMINDERS) return;
    reminders = [...reminders, newReminder(dueDate)];
    editingIndex = reminders.length - 1;
    unconfirmedIndex = editingIndex;
  }

  function remove(index: number) {
    reminders = reminders.filter((_, i) => i !== index);
    editingIndex = null;
    unconfirmedIndex = null;
    localErrors = {};
  }

  function done(index: number) {
    const error = validateReminder(reminders[index]);
    if (error) {
      localErrors = { ...localErrors, [index]: error };
      return;
    }
    editingIndex = null;
    unconfirmedIndex = null;
  }

  function cancel(index: number) {
    if (unconfirmedIndex === index) remove(index);
    else done(index);
  }

  function setDate(index: number, date: string) {
    const { time } = toLocalInputs(reminders[index].startAt);
    const iso = fromLocalInputs(date, time);
    if (iso) update(index, { startAt: iso });
  }

  function setTime(index: number, time: string) {
    const { date } = toLocalInputs(reminders[index].startAt);
    const iso = fromLocalInputs(date, time);
    if (iso) update(index, { startAt: iso });
  }

  function setFrequency(index: number, frequency: ReminderFrequency) {
    const current = reminders[index].repeat;
    const interval = frequency === 'none' ? 1 : Math.min(current.interval || 1, MAX_INTERVAL[frequency]);
    update(index, { repeat: { frequency, interval, weekdays: frequency === 'weekly' ? current.weekdays : [] } });
  }

  function setInterval(index: number, value: string) {
    const interval = Math.floor(Number(value));
    update(index, { repeat: { ...reminders[index].repeat, interval: Number.isFinite(interval) ? interval : 1 } });
  }

  function effectiveWeekdays(reminder: TaskReminder): IsoWeekday[] {
    return reminder.repeat.weekdays.length > 0 ? reminder.repeat.weekdays : [isoWeekday(new Date(reminder.startAt))];
  }

  function toggleWeekday(index: number, day: IsoWeekday) {
    const current = effectiveWeekdays(reminders[index]);
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    if (next.length === 0) return; // keep at least one day
    update(index, { repeat: { ...reminders[index].repeat, weekdays: next.sort((a, b) => a - b) } });
  }

  function toggleChannel(index: number, channel: 'email' | 'push') {
    const channels = reminders[index].channels;
    update(index, { channels: { ...channels, [channel]: !channels[channel] } });
  }
</script>

<section class="space-y-3" aria-labelledby="reminders-heading">
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <h3 id="reminders-heading" class="text-sm font-medium text-stone-900 dark:text-stone-100">Reminders</h3>
      {#if reminders.length > 0}
        <span class="px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
          {reminders.length}
        </span>
      {/if}
    </div>
    <button
      type="button"
      on:click={add}
      disabled={disabled || reminders.length >= MAX_REMINDERS || editingIndex !== null}
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl neu-raised-sm neu-interactive
             text-primary-700 dark:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add reminder
    </button>
  </div>

  {#if reminders.length === 0}
    <p class="text-sm text-stone-500 dark:text-stone-400">
      No reminders. Add one to get an email or browser notification, once or on repeat.
    </p>
  {/if}

  <ul class="space-y-2">
    {#each reminders as reminder, index (index)}
      {@const inputs = toLocalInputs(reminder.startAt)}
      {@const next = upcomingAt(reminder)}
      <li class={editingIndex === index ? 'neu-pressed p-4' : 'neu-raised-sm p-3'}>
        {#if editingIndex !== index}
          <!-- Summary row -->
          <div class="flex items-start justify-between gap-3">
            <button
              type="button"
              class="flex-1 min-w-0 text-left"
              on:click={() => (editingIndex = index)}
              disabled={disabled || editingIndex !== null}
            >
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">
                {formatReminderTime(reminder.startAt)}
              </p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {describeRepeat(reminder)} · {describeChannels(reminder.channels)}
                {#if reminder.repeat.frequency !== 'none'}
                  · {next ? `next ${formatReminderTime(next)}` : 'finished'}
                {:else if !next}
                  · sent
                {/if}
              </p>
            </button>
            <button
              type="button"
              on:click={() => remove(index)}
              disabled={disabled || editingIndex !== null}
              class="p-1 text-stone-400 hover:text-error-600 dark:hover:text-error-400 disabled:opacity-50"
              aria-label="Remove reminder"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {#if allErrors[index]}
            <p class="mt-2 text-xs text-error-600 dark:text-error-400" role="alert">{allErrors[index]}</p>
          {/if}
        {:else}
          <!-- Edit form -->
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Date</span>
                <input
                  type="date"
                  value={inputs.date}
                  on:change={(e) => setDate(index, e.currentTarget.value)}
                  class="w-full px-3 py-2 rounded-xl neu-raised-sm text-sm text-stone-900 dark:text-stone-100 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
              </label>
              <label class="block">
                <span class="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Time</span>
                <input
                  type="time"
                  value={inputs.time}
                  on:change={(e) => setTime(index, e.currentTarget.value)}
                  class="w-full px-3 py-2 rounded-xl neu-raised-sm text-sm text-stone-900 dark:text-stone-100 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
              </label>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="block">
                <span class="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Repeat</span>
                <select
                  value={reminder.repeat.frequency}
                  on:change={(e) => setFrequency(index, e.currentTarget.value as ReminderFrequency)}
                  class="w-full px-3 py-2 rounded-xl neu-raised-sm text-sm text-stone-900 dark:text-stone-100 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {#each FREQUENCY_OPTIONS as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </label>

              {#if reminder.repeat.frequency !== 'none'}
                {@const unit = UNIT_LABEL[reminder.repeat.frequency]}
                <label class="block">
                  <span class="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Every</span>
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={MAX_INTERVAL[reminder.repeat.frequency]}
                      value={reminder.repeat.interval}
                      aria-label="Repeat every how many {unit[1]}"
                      on:input={(e) => setInterval(index, e.currentTarget.value)}
                      class="w-20 px-3 py-2 rounded-xl neu-raised-sm text-sm text-stone-900 dark:text-stone-100 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    />
                    <span class="text-sm text-stone-600 dark:text-stone-400">
                      {reminder.repeat.interval === 1 ? unit[0] : unit[1]}
                    </span>
                  </div>
                </label>
              {/if}
            </div>

            {#if reminder.repeat.frequency === 'weekly'}
              {@const selectedDays = effectiveWeekdays(reminder)}
              <div>
                <span class="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">On</span>
                <div class="flex gap-1.5" role="group" aria-label="Days of the week">
                  {#each WEEKDAYS as day}
                    {@const on = selectedDays.includes(day.value)}
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-label={day.label}
                      on:click={() => toggleWeekday(index, day.value)}
                      class="w-9 h-9 rounded-full text-xs font-semibold transition-all
                             {on ? 'bg-primary-600 text-white' : 'neu-raised-sm text-stone-600 dark:text-stone-300'}"
                    >
                      {day.short}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <div>
              <span class="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Send via</span>
              <div class="flex flex-wrap gap-2" role="group" aria-label="Channels">
                {#each [{ key: 'email', label: 'Email' }, { key: 'push', label: 'Browser' }] as channel}
                  {@const on = reminder.channels[channel.key as 'email' | 'push']}
                  <button
                    type="button"
                    aria-pressed={on}
                    on:click={() => toggleChannel(index, channel.key as 'email' | 'push')}
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                           {on ? 'neu-pressed nav-active text-primary-700 dark:text-primary-300' : 'neu-raised-sm text-stone-600 dark:text-stone-300'}"
                  >
                    {#if on}
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    {/if}
                    {channel.label}
                  </button>
                {/each}
              </div>
              {#if reminder.channels.push && !accountPushOn}
                <p class="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  Browser notifications are off on your account.
                  <a href="/settings#notifications" class="underline">Turn them on in Settings</a> to receive these.
                </p>
              {/if}
              {#if reminder.channels.email && !accountEmailOn}
                <p class="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  Email notifications are off on your account.
                  <a href="/settings#notifications" class="underline">Turn them on in Settings</a> to receive these.
                </p>
              {/if}
            </div>

            {#if allErrors[index]}
              <p class="text-sm text-error-600 dark:text-error-400" role="alert">{allErrors[index]}</p>
            {/if}

            <div class="flex justify-end gap-2">
              <button
                type="button"
                on:click={() => cancel(index)}
                class="px-3 py-1.5 text-sm font-medium rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/60"
              >
                {unconfirmedIndex === index ? 'Cancel' : 'Close'}
              </button>
              <button
                type="button"
                on:click={() => done(index)}
                class="px-3 py-1.5 text-sm font-medium rounded-xl bg-primary-600 text-white"
              >
                Done
              </button>
            </div>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</section>
