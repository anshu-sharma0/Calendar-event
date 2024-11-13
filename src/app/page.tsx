'use client'
import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useSession, signIn, signOut } from "next-auth/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIMEZONE_OPTIONS = [
  { value: 'America/Adak', label: 'Adak (HST/HDST)' },
  { value: 'America/Anchorage', label: 'Anchorage (AKST/AKDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK/MSD)' },
  { value: 'Pacific/Midway', label: 'Midway Island (SST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'Atlantic/Reykjavik', label: 'Reykjavik (GMT)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
];

export default function CalendarComponent() {
  const { data: session } = useSession(); 
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState("Asia/Kolkata");

  // Convert time from local timezone to target timezone
  const convertToTargetTimezone = (localDate: Date, localTime: string, targetTimezone: string) => {
    // Create date object with selected date and time
    const [hours, minutes] = localTime.split(":");
    const localDateTime = new Date(localDate);
    localDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Get the target timezone offset
    const targetDate = new Date(localDateTime.toLocaleString('en-US', { timeZone: targetTimezone }));
    const targetOffset = targetDate.getTime() - localDateTime.getTime();

    // Create the final date in target timezone
    const finalDate = new Date(localDateTime.getTime() + targetOffset);
    
    return finalDate;
  };

  const createEvent = async () => {
    if (!session?.accessToken) {
      toast.error("Please log in to create an event.");
      return;
    }

    if (!eventName) {
      toast.error("Please enter a name for the event.");
      return;
    }

    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    setIsLoading(true);

    try {
      // Convert the selected local time to the target timezone
      const startDateTime = convertToTargetTimezone(date, selectedTime, selectedTimezone);
      
      // Create end time (1 hour after start time)
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

      // Format times in ISO string with the correct timezone
      const timeZoneFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: selectedTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      });

      // Get the formatted strings
      const startTimeStr = startDateTime.toISOString();
      const endTimeStr = endDateTime.toISOString();

      // Current timezone for display
      const timeZoneDisplay = timeZoneFormatter.format(startDateTime);

      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: eventName,
          description: `Event created in ${timeZoneDisplay}`,
          start: {
            dateTime: startTimeStr,
            timeZone: selectedTimezone,
          },
          end: {
            dateTime: endTimeStr,
            timeZone: selectedTimezone,
          },
        }),
      });

      if (response.ok) {
        toast.success(`Event created successfully in ${TIMEZONE_OPTIONS.find(tz => tz.value === selectedTimezone)?.label}!`);
        setEventName("");
        setDate(new Date());
        setSelectedTime("09:00");
      } else {
        const errorData = await response.json();
        console.error("Error creating event:", errorData);
        toast.error("Failed to create event.");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("An error occurred while creating the event.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    const today = new Date();
    if (selectedDate && selectedDate >= today.setHours(0, 0, 0, 0)) {
      setDate(selectedDate);
    }
  };

  const today = new Date();
  const todayDate = today.toISOString().split('T')[0];

  return (
    <div className="max-w-lg mx-auto p-8 bg-gradient-to-br from-white to-gray-100 rounded-lg shadow-lg font-sans text-gray-800 relative">
      <ToastContainer />
      {session ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-lg font-semibold">Signed in as {session?.user?.name}</p>
            <button
              onClick={() => signOut()}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200">
              Sign out
            </button>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Create a New Event</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Event Name:</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Enter event name"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Timezone:</label>
              <Select
                value={selectedTimezone}
                onValueChange={(value) => setSelectedTimezone(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Current timezone: {new Intl.DateTimeFormat('en-US', { timeZoneName: 'long' }).format(new Date())}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Select Date:</label>
              <Calendar
                mode="single"
                fromDate={new Date(todayDate)}
                selected={date}
                onSelect={handleDateSelect}
                className="rounded-md border border-gray-300 flex justify-center w-full"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Select Time ({selectedTimezone}):</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={createEvent}
              disabled={isLoading}
              className={`w-full py-2 rounded transition duration-200 ${
                isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {isLoading ? "Creating Event..." : "Create Event in Google Calendar"}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="text-lg mb-4">Please sign in to create an event</p>
          <button
            onClick={() => signIn("google")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200">
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}
