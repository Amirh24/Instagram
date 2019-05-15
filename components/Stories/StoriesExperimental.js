import React from 'react';
import {
  StyleSheet,
  Platform,
  View,
  ScrollView,
  PanResponder,
  Dimensions,
  FlatList,
  Animated,
  StatusBar,
} from 'react-native';
import { connect } from 'react-redux';
import Story from './Story';
import dispatch from '../../rematch/dispatch';
import { verticalSwipe } from '../../rematch/stories';

const { width, height } = Dimensions.get('window');
const halfWidth = width * 0.5;
const perspective = width;
const angle = Math.atan(perspective / halfWidth);
const ratio = 2; //Platform.OS === 'ios' ? 2 : 1.2;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export const swipeDirections = {
  SWIPE_UP: 'SWIPE_UP',
  SWIPE_DOWN: 'SWIPE_DOWN',
  SWIPE_LEFT: 'SWIPE_LEFT',
  SWIPE_RIGHT: 'SWIPE_RIGHT',
};

const swipeConfig = {
  velocityThreshold: 0.3,
  directionalOffsetThreshold: 80,
};

function isValidSwipe(velocity, velocityThreshold, directionalOffset, directionalOffsetThreshold) {
  return (
    Math.abs(velocity) > velocityThreshold &&
    Math.abs(directionalOffset) < directionalOffsetThreshold
  );
}
class StoriesView extends React.Component {
  horizontalSwipe = new Animated.Value(0);

  constructor(props) {
    super(props);
    this.onScroll = Animated.event(
      [
        {
          nativeEvent: { contentOffset: { x: this.horizontalSwipe } },
        },
      ],
      {
        useNativeDriver: true,
      }
    );
    this.swipeConfig = Object.assign(swipeConfig, props.config);

    this.panResponder = PanResponder.create({
      //   onMoveShouldSetResponderCapture: () => true,
      //   onStartShouldSetPanResponder: this._handleShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._onMoveShouldSetPanResponderCapture,
      onMoveShouldSetPanResponderCapture: this._onMoveShouldSetPanResponderCapture,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminate: this._handlePanResponderEnd,
      onPanResponderGrant: () => {
        console.log('Start Gesture');
        // dispatch().stories.onPanResponderGrant();
        dispatch().stories.pause();
        dispatch().stories.setBackOpacity(0);
      },
      //   onPanResponderMove: (e, gesture) => {
      //     console.log('onPanResponderMove');
      //     dispatch().stories.onPanResponderMove({ e, gesture });
      //   },
    });
  }

  _onMoveShouldSetPanResponderCapture = ({ nativeEvent: { touches } }, { dy }) => {
    // if (Math.abs(dx) > 5) {
    //   dispatch().stories.update({ swipedHorizontally: true });
    //   return true;
    // }
    const isSingleFinger = touches.length === 1;

    if (isSingleFinger && dy > 5) {
      dispatch().stories.update({ swipedHorizontally: false });
      return true;
    }
    // console.log('should capture: ', isSingleFinger);
    dispatch().stories.update({ swipedHorizontally: true });

    return false;
  };

  _triggerSwipeHandlers = (swipeDirection, gestureState) => {
    const { onSwipe, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onTap } = this.props;
    const { SWIPE_LEFT, SWIPE_RIGHT, SWIPE_UP, SWIPE_DOWN } = swipeDirections;
    onSwipe && onSwipe(swipeDirection, gestureState);
    switch (swipeDirection) {
      case SWIPE_LEFT:
        onSwipeLeft && onSwipeLeft(gestureState);
        break;
      case SWIPE_RIGHT:
        onSwipeRight && onSwipeRight(gestureState);
        break;
      case SWIPE_UP:
        onSwipeUp && onSwipeUp(gestureState);
        break;
      case SWIPE_DOWN:
        onSwipeDown && onSwipeDown(gestureState);
        break;
      default:
        onTap && onTap(gestureState);
        break;
    }
  };

  _getSwipeDirection = gestureState => {
    const { SWIPE_LEFT, SWIPE_RIGHT, SWIPE_UP, SWIPE_DOWN } = swipeDirections;
    const { dx, dy } = gestureState;
    if (this._isValidHorizontalSwipe(gestureState)) {
      return dx > 0 ? SWIPE_RIGHT : SWIPE_LEFT;
    } else if (this._isValidVerticalSwipe(gestureState)) {
      return dy > 0 ? SWIPE_DOWN : SWIPE_UP;
    }
    return null;
  };

  _handlePanResponderEnd = (evt, gestureState) => {
    const direction = this._getSwipeDirection(gestureState);

    console.log('End Gesture', direction);
    // this._triggerSwipeHandlers(swipeDirection, gestureState);
    dispatch().stories.onPanResponderRelease({ direction });
  };

  _isValidHorizontalSwipe = gestureState => {
    const { vx, dy } = gestureState;
    const { velocityThreshold, directionalOffsetThreshold } = this.swipeConfig;
    return isValidSwipe(vx, velocityThreshold, dy, directionalOffsetThreshold);
  };

  _isValidVerticalSwipe = gestureState => {
    const { vy, dx } = gestureState;
    const { velocityThreshold, directionalOffsetThreshold } = this.swipeConfig;
    return isValidSwipe(vy, velocityThreshold, dx, directionalOffsetThreshold);
  };

  componentDidMount() {
    StatusBar.setHidden(true);
  }

  renderItem = ({ item, index }) => {
    return (
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, width, height },
          { transform: this._getTransformsFor(index) },
        ]}
        key={`child-${index}`}>
        <Story story={item} currentDeck={this.props.deckIdx === index} />
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'black' },
            this._getOpacityFor(index),
          ]}
        />
      </Animated.View>
    );
  };

  _getOpacityFor = i => {
    let pageX = width * i;
    let opacity = this.horizontalSwipe.interpolate({
      inputRange: [pageX - width, pageX, pageX + width],
      outputRange: [0.9, 0, 0.9],
      extrapolate: 'clamp',
    });

    return {
      opacity,
    };
  };

  _renderPlaceholders = (child, i) => {
    return <View key={`placeholder-${i}`} pointerEvents={'none'} style={{ width, height }} />;
  };

  _getTransformsFor = i => {
    let scrollX = this.horizontalSwipe;
    let pageX = width * i;
    let translateX = scrollX.interpolate({
      inputRange: [pageX - width, pageX, pageX + width],
      outputRange: [width / 2, 0, -width / 2],
      extrapolate: 'clamp',
    });

    let rotateY = scrollX.interpolate({
      inputRange: [pageX - width, pageX, pageX + width],
      outputRange: ['60deg', '0deg', '-60deg'],
      extrapolate: 'clamp',
    });

    let translateXAfterRotate = scrollX.interpolate({
      //   inputRange: [pageX - width, pageX, pageX + width],
      inputRange: [pageX - width, pageX - width + 0.1, pageX, pageX + width - 0.1, pageX + width],
      outputRange: [width, width / 2.38, 0, -width / 2.38, -width],
      extrapolate: 'clamp',
    });

    const dismissTranslationY = {
      translateY: verticalSwipe.interpolate({
        inputRange: [-1, 0, height],
        outputRange: [0, 0, height / 2],
      }),
    };

    let scale = 1;

    if (!this.props.swipedHorizontally) {
      scale = verticalSwipe.interpolate({
        inputRange: [-1, 0, height],
        outputRange: [1, 1, 0.75],
      });
    }

    return [
      { perspective: width },
      { translateX },
      { rotateY },
      { translateX: translateXAfterRotate },
      dismissTranslationY,
      { scale },
    ];
  };

  get node() {
    if (!this.viewPager || !this.viewPager._component) {
      return null;
    }
    return this.viewPager._component;
  }

  componentDidUpdate(prevProps) {
    if (this.props.deckIdx !== prevProps.deckIdx) {
      if (this.node) {
        this.node.scrollTo({ x: this.props.deckIdx * width, duration: 1000 });
      }
    }
  }

  render() {
    const { stories = [], swipedHorizontally } = this.props;

    return (
      <View style={styles.container}>
        <AnimatedScrollView
          {...this.panResponder.panHandlers}
          ref={ref => (this.viewPager = ref)}
          onScroll={this.onScroll}
          scrollEventThrottle={16}
          horizontal
          style={{ flex: 1 }}
          bounces={false}
          alwaysBounceHorizontal={false}
          showsHorizontalScrollIndicator={false}
          data={stories}
          pagingEnabled>
          <Animated.View
            style={[
              { position: 'absolute', top: 0, left: 0, width, height },
              { transform: [{ translateX: this.horizontalSwipe }] },
            ]}>
            {stories.map((item, index) => this.renderItem({ item, index }))}
          </Animated.View>
          {this.props.stories.map(this._renderPlaceholders)}
        </AnimatedScrollView>
      </View>
    );
    // children={stories.map((item, index) => this.renderItem({ item, index }))}
  }
}

// {stories.map((story, idx) => {
//     //   let scale = verticalSwipe.interpolate({
//     //     inputRange: [-1, 0, height],
//     //     outputRange: [1, 1, 0.75],
//     //   });

//     //   if (swipedHorizontally) {
//     //     scale = horizontalSwipe.interpolate({
//     //       inputRange: [width * (idx - 1), width * idx, width * (idx + 1)],
//     //       outputRange: [0.79, 1, 0.78],
//     //     });
//     //   }

//     const offset = idx * width;
//     const inputRange = [offset - width, offset + width];
//     const translateX = horizontalSwipe.interpolate({
//       inputRange,
//       outputRange: [width / ratio, -width / ratio],
//       extrapolate: 'clamp',
//     });

//     const rotateY = horizontalSwipe.interpolate({
//       inputRange,
//       outputRange: [`${angle}rad`, `-${angle}rad`],
//       extrapolate: 'clamp',
//     });
//     const rotateYValue = rotateY.__getValue();

//     const parsed = parseFloat(rotateYValue.substr(0, rotateYValue.indexOf('rad')), 10);
//     const alpha = Math.abs(parsed);
//     const gamma = angle - alpha;
//     const beta = Math.PI - alpha - gamma;
//     const w = halfWidth - (halfWidth * Math.sin(gamma)) / Math.sin(beta);
//     const translateX2 = parsed > 0 ? w : -w;

//     return (
//       <Animated.View
//         key={idx}
//         style={[
//           styles.deck,
//           {
//             transform: [
//               { perspective },
//               { translateX },
//               { rotateY },
//               { translateX: translateX2 },

//               // {
//               //   translateX: horizontalSwipe.interpolate({
//               //     inputRange: [width * (idx - 1), width * idx, width * (idx + 1)],
//               //     outputRange: [width, 0, -width],
//               //   }),
//               // },
//               // {
//               //   translateY: verticalSwipe.interpolate({
//               //     inputRange: [-1, 0, height],
//               //     outputRange: [0, 0, height / 2],
//               //   }),
//               // },
//               // { scale },
//             ],
//           },
//         ]}>
//         <Story story={story} currentDeck={deckIdx === idx} />
//       </Animated.View>
//     );
//   })}
export default connect(({ stories }) => ({ ...stories }))(StoriesView);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  deck: {
    width,
    height,
  },
});
