function mySettings(props) {
  const screenWidth = props.settingsStorage.getItem("screenWidth");
  const screenHeight = props.settingsStorage.getItem("screenHeight");

  const cornerOptions = [
    { name: "(none)", value: "none" },
    { name: "Steps", value: "steps" },
    { name: "Heart rate", value: "heartRate" },
    { name: "Weather", value: "weather" },
    { name: "Calories", value: "calories" },
    { name: "Active minutes", value: "activeMinutes" },
    { name: "Location", value: "location" }
  ];

  return (
    <Page>
      <Section title={<Text bold>Display</Text>}>
        <Select
          label="Temperature unit"
          settingsKey="temperatureUnit"
          selectViewTitle="Pick a unit"
          options={[
            { name: "Celsius (°C)", value: "celsius" },
            { name: "Fahrenheit (°F)", value: "fahrenheit" }
          ]}
        />
      </Section>

      <Section title={<Text bold>Corners</Text>}>
        <Select label="Top left"     settingsKey="corner-tl" options={cornerOptions} />
        <Select label="Top right"    settingsKey="corner-tr" options={cornerOptions} />
        <Select label="Bottom left"  settingsKey="corner-bl" options={cornerOptions} />
        <Select label="Bottom right" settingsKey="corner-br" options={cornerOptions} />
      </Section>

      <Section title={<Text bold>Background</Text>}>
        <ImagePicker
          title="Background image"
          description="Pick an image from your phone to replace the clockface background."
          label="Pick a background"
          settingsKey="background-image"
          imageWidth={screenWidth}
          imageHeight={screenHeight}
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);
