import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

interface DateTimePickerComponentProps {
  timestamp: number;
  onChange: (timestamp: number) => void;
}

export default function DateTimePickerComponent({
  timestamp,
  onChange,
}: DateTimePickerComponentProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(timestamp));

  // Sincronizar tempDate cuando cambia el timestamp prop
  useEffect(() => {
    setTempDate(new Date(timestamp));
  }, [timestamp]);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("es-ES", options);
  };

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleTimeString("es-ES", options);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      const newDate = new Date(tempDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setTempDate(newDate);
      onChange(newDate.getTime());
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (selectedTime) {
      const newDate = new Date(tempDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setTempDate(newDate);
      onChange(newDate.getTime());
    }
  };

  return (
    <View className="bg-white p-4 border-t border-gray-100">
      <Text className="text-gray-600 text-sm mb-3">Fecha y hora</Text>

      <View className="flex-row gap-3">
        {/* Date Selector */}
        <TouchableOpacity
          className="flex-1 bg-gray-50 p-3 rounded-lg flex-row items-center justify-between"
          onPress={() => setShowDatePicker(true)}
        >
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text className="text-black ml-2">{formatDate(tempDate)}</Text>
          </View>
        </TouchableOpacity>

        {/* Time Selector */}
        <TouchableOpacity
          className="flex-1 bg-gray-50 p-3 rounded-lg flex-row items-center justify-between"
          onPress={() => setShowTimePicker(true)}
        >
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text className="text-black ml-2">{formatTime(tempDate)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          locale="es-ES"
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange}
          locale="es-ES"
        />
      )}

      {/* iOS Done Button */}
      {Platform.OS === "ios" && (showDatePicker || showTimePicker) && (
        <View className="mt-3">
          <TouchableOpacity
            className="bg-primary py-2 rounded-lg"
            onPress={() => {
              setShowDatePicker(false);
              setShowTimePicker(false);
            }}
          >
            <Text className="text-white text-center font-bold">Listo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
