import { LinearGradient, takeSnapshotAsync } from 'expo';
import React from 'react';
import { Text, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import IconButton from '../components/IconButton';
import Header from '../components/MediaHeader';
import dispatch from '../rematch/dispatch';

const typefaceButtonSize = 36;

class TypefaceButton extends React.Component {
  render() {
    const { onPress, title } = this.props;
    return (
      <TouchableOpacity style={{ height: typefaceButtonSize }} onPress={onPress}>
        <View
          style={{
            borderWidth: 2,
            borderRadius: typefaceButtonSize + 4,
            borderColor: 'white',
            paddingVertical: 4,
            paddingHorizontal: 16,
            minWidth: 80,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.05)',
          }}>
          <Text style={{ color: 'white', fontSize: 12, textAlign: 'center' }}>
            {title.toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const DEFAULT_PLACEHOLDER = 'Tap to Type';
class TypeScreen extends React.Component {
  state = { useEffect: false, value: '', placeholder: DEFAULT_PLACEHOLDER };

  componentWillMount() {
    global.takeGradientPictureGlobal = this.captureAsync;
  }
  onEffectPressed = () => {
    // this.setState({ useEffect: !this.state.useEffect });
  };

  captureAsync = async () => {
    console.log('heeee', this.imageContainer);
    if (!this.imageContainer) {
      return;
    }
    await new Promise(res => this.setState({ placeholder: '' }, res));
    try {
      const image = await takeSnapshotAsync(this.imageContainer, {
        format: 'png',
        quality: 0.9,
        result: 'data-uri',
      });
      dispatch().image.set(image);
    } catch (e) {
      alert(e.message);
    } finally {
      this.setState({ placeholder: DEFAULT_PLACEHOLDER });
    }
  };
  render() {
    const {
      gradient,
      gradientTheme,
      onPressTypefaceButton,
      useGradientCamera,
      typeface,
    } = this.props;
    const opacity = this.state.useEffect ? 1 : 0.5;
    const isLight = gradientTheme === 'light';
    const textColor = isLight ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`;
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }} key="image-container" ref={ref => (this.imageContainer = ref)}>
          <LinearGradient
            style={[StyleSheet.absoluteFill, { opacity: useGradientCamera ? 0.5 : 1 }]}
            {...gradient}
          />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <TextInput
              onChangeText={value => this.setState({ value })}
              placeholderTextColor={textColor}
              placeholder={this.state.placeholder}
              style={[
                {
                  outlineStyle: 'none',
                  color: textColor,
                  fontSize: 28,
                  // fontWeight: 'bold',
                  textAlign: 'center',
                  padding: 6,
                  borderRadius: 4,
                },
                this.state.useEffect && { backgroundColor: isLight ? 'red' : 'white' },
                typeface.style,
              ]}
              value={this.state.value}
            />
          </View>
        </View>
        <Header>
          <IconButton name={'text-effect'} onPress={this.onEffectPressed} />
          <TypefaceButton title={typeface.name} onPress={onPressTypefaceButton} />
          <View />
        </Header>
      </View>
    );
  }
}

export default TypeScreen;
