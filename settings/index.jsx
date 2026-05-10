function mySettings(props) {
  const screenWidth = props.settingsStorage.getItem("screenWidth");
  const screenHeight = props.settingsStorage.getItem("screenHeight");

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
