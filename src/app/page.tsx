"use client";
import { Calendar } from "@/components/ui/calendar";
import { useSession, signIn, signOut } from "next-auth/react";
import React, { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CalendarComponent() {
  const { data: session } = useSession();
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const createEvent = async () => {
    if (!session?.accessToken) {
      toast.error("Please log in to create an event.");
      return;
    }

    if (!eventName) {
      toast.error("Please enter a name for the event.");
      return;
    }

    setIsLoading(true);
    const startTime = new Date(date);
    const [hours, minutes] = selectedTime.split(":");
    startTime.setHours(hours);
    startTime.setMinutes(minutes);

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);

    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: eventName,
          description: "Event created from the app.",
          start: {
            dateTime: startTime.toISOString(),
            timeZone: "Asia/Kolkata",
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: "Asia/Kolkata",
          },
        }),
      });

      if (response.ok) {
        toast.success("Event created successfully!");
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

  const handleDateSelect = (selectedDate: any) => {
    const today = new Date();
    if (selectedDate >= today.setHours(0, 0, 0, 0)) {
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

            <div className="mb-4 ">
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
              <label className="block text-sm font-medium mb-1">Select Time:</label>
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
