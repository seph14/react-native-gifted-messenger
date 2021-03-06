import React, {
  Component,
} from 'react';
import {
  Text,
  View,
  ListView,
  TextInput,
  Dimensions,
  Animated,
  Platform,
  PixelRatio,
  LayoutAnimation,
  StyleSheet,
  Image,
  TouchableOpacity
} from 'react-native';

import Message from './Message';
import GiftedSpinner from 'react-native-gifted-spinner';
import moment from 'moment';
import {setLocale} from './Locale';
import deepEqual from 'deep-equal';
import Button from 'react-native-button';
import InvertibleScrollView from 'react-native-invertible-scroll-view';

const isAndroid = (Platform.OS === 'android');

class GiftedMessenger extends Component {

  constructor(props) {
    super(props);

    this.onFooterLayout = this.onFooterLayout.bind(this);
    this.renderRow = this.renderRow.bind(this);
    this.renderLoadEarlierMessages = this.renderLoadEarlierMessages.bind(this);
    this.onLayout = this.onLayout.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.onChangeVisibleRows = this.onChangeVisibleRows.bind(this);
    this.onKeyboardWillShow = this.onKeyboardWillShow.bind(this);
    this.onKeyboardDidShow = this.onKeyboardDidShow.bind(this);
    this.onKeyboardWillHide = this.onKeyboardWillHide.bind(this);
    this.onKeyboardDidHide = this.onKeyboardDidHide.bind(this);
    this.onChangeText = this.onChangeText.bind(this);
    this.onSend = this.onSend.bind(this);

    this._firstDisplay = true;
    this._listHeight = 0;
    this._footerY = 0;
    this._scrollToBottomOnNextRender = false;
    this._scrollToPreviousPosition = false;
    this._visibleRows = { s1: { } };

    let textInputHeight = 44;
    if (!this.props.hideTextInput) {
      if (this.props.styles.hasOwnProperty('textInputContainer')) {
        textInputHeight = this.props.styles.textInputContainer.height || textInputHeight;
      }
    }

    this.listViewMaxHeight = this.props.maxHeight - textInputHeight;

    const ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => {
        if (r1.status !== r2.status) {
          return true;
        }
        return false;
      },
    });

    this.state = {
      dataSource: ds.cloneWithRows([]),
      text: props.text,
      disabled: true,
      openOptions:false,
      height: this.listViewMaxHeight, //new Animated.Value(this.listViewMaxHeight),
      appearAnim: new Animated.Value(0),
    };
  }

  componentWillMount() {
    const isAndroid = (Platform.OS === 'android');
    this.styles = {
      container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
      },
      listView: {
        flex: 1,
        backgroundColor: '#f5f5f5',
      },
      textInputContainer: {
        height: 44,
        borderTopWidth:StyleSheet.hairlineWidth,
        backgroundColor:'#f5f5f5',
        borderColor: '#ccc',
        flexDirection: 'row',
        paddingLeft: 16,
        paddingRight:16,
      },
      textInputWithButtons:{
        height: 124,
        overflow:'hidden',
        borderTopWidth:StyleSheet.hairlineWidth,
        backgroundColor:'#f5f5f5',
        borderColor: '#ccc',
        flexDirection: 'row',
      },
      textInput: {
        alignSelf: 'center',
        height: 30,
        width: 100,
        backgroundColor: '#fff',
        borderWidth:StyleSheet.hairlineWidth,
        borderColor:'#ccc',
        color:'#666',
        borderRadius:4,
        flex: 1,
        paddingVertical: 0,
        paddingHorizontal:8,
        margin: 0,
        fontSize: 15,
      },
      sendButton: {
        marginTop: 11,
        marginLeft: 10,
      },
      date: {
        color: '#aaaaaa',
        fontSize: 12,
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 8,
      },
      link: {
        color: '#007aff',
        textDecorationLine: 'underline',
      },
      linkLeft: {
        color: '#000',
      },
      linkRight: {
        color: '#fff',
      },
      loadEarlierMessages: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
      },
      loadEarlierMessagesButton: {
        fontSize: 14,
        color:'#ccc'
      },
      imgButton:{
        width:30,
        height:30,
        backgroundColor:"#fff",
        borderWidth:StyleSheet.hairlineWidth,
        borderColor:'#ccc',
        borderRadius:15,
        marginTop:7,
        marginLeft:16,
        alignItems:'center',
        justifyContent:'center',
        overflow:'hidden'
      },
      imgSrc:{
        width:18,
        height:18,
        backgroundColor:'#fff',
        tintColor:'#666'
      }
    };

    Object.assign(this.styles, this.props.styles);

    if (this.props.dateLocale !== '')
      setLocale(this.props.dateLocale);
  }

  componentDidMount() {
    this.scrollResponder = this.refs.listView.getScrollResponder();

    if (this.props.messages.length > 0) {
      this.setMessages(this.props.messages);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.typingMessage !== this.props.typingMessage) {
      if (this.isLastMessageVisible()) {
        this._scrollToBottomOnNextRender = true;
      }
    }

    if (deepEqual(nextProps.messages, this.props.messages) === false) {
      let isAppended = null;
      if (nextProps.messages.length === this.props.messages.length) {
        // we assume that only a status has been changed
        if (this.isLastMessageVisible()) {
          isAppended = true; // will scroll to bottom
        } else {
          isAppended = null;
        }
      } else if (deepEqual(nextProps.messages[nextProps.messages.length - 1], this.props.messages[this.props.messages.length - 1]) === false) {
        // we assume the messages were appended
        isAppended = true;
      } else {
        // we assume the messages were prepended
        isAppended = false;
      }
      this.setMessages(nextProps.messages, isAppended);
    }

    let textInputHeight = 44;
    if (nextProps.styles.hasOwnProperty('textInputContainer')) {
      textInputHeight = nextProps.styles.textInputContainer.height || textInputHeight;
    }

    if (nextProps.maxHeight !== this.props.maxHeight) {
      this.listViewMaxHeight = nextProps.maxHeight;
      /*Animated.timing(this.state.height, {
        toValue: this.listViewMaxHeight,
        duration: 150,
      }).start();*/
      LayoutAnimation.configureNext({
        duration: 250,
        create: {
          type:     LayoutAnimation.Types.linear,
          property: LayoutAnimation.Properties.opacity,
        },
        update: { type: 'keyboard' }
      });
      this.setState({height:this.listViewMaxHeight});
    }

    if (nextProps.hideTextInput && !this.props.hideTextInput) {
      this.listViewMaxHeight += textInputHeight;

      this.setState({
        height: new Animated.Value(this.listViewMaxHeight),
      });
    } else if (!nextProps.hideTextInput && this.props.hideTextInput) {
      this.listViewMaxHeight -= textInputHeight;

      this.setState({
        height: new Animated.Value(this.listViewMaxHeight),
      });
    }
  }

  onSend() {
    const message = {
      text: this.state.text.trim(),
      name: this.props.senderName,
      image: this.props.senderImage,
      position: 'right',
      date: new Date(),
    };
    if (this.props.onCustomSend) {
      this.props.onCustomSend(message);
    } else {
      this.onChangeText('');
      this.props.handleSend(message);
    }
  }

  onOpenPanel(){
    if(this.state.openOptions){
      this._input && this._input.focus();
      return;
    }

    
    if(this.state.height < this.listViewMaxHeight - 20){
      let self = this;
      this.setState({openOptions:true},()=>{
        self._input.blur();
      });
    }else{
      LayoutAnimation.configureNext({
        duration: 250,
        create: {
          type:     LayoutAnimation.Types.linear,
          property: LayoutAnimation.Properties.opacity,
        },
        update: { type: isAndroid?'linear':'keyboard' }
      });
      this.setState({height:this.listViewMaxHeight - 124, openOptions:true});
    }
  }

  onKeyboardWillHide(e) {
    //let offset = e.endCoordinates.height;
    LayoutAnimation.configureNext({
      duration: isAndroid?250:e.duration,
      create: {
        type:     LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
      },
      update: { type: isAndroid?'linear':'keyboard' }
    });
    if(this.state.openOptions){
      this.setState({height:this.listViewMaxHeight-124, openOptions:true});
    }else this.setState({height:this.listViewMaxHeight, openOptions:false});

    /*if (this.props.keyboardShouldPersistTaps === false) {
      if (this.isLastMessageVisible()) {
        this.scrollToBottom(true,offset);
      }
    }*/
    /*Animated.timing(this.state.height, {
      toValue: this.listViewMaxHeight,
      duration: 150,
    }).start();*/
  }

  onKeyboardDidHide(e) {
    if (Platform.OS === 'android') {
      this.onKeyboardWillHide(e);
    }
    // TODO test in android
    if (this.props.keyboardShouldPersistTaps === false) {
      if (this.isLastMessageVisible()) {
        this.scrollToBottom();
      }
    }
  }

  onKeyboardWillShow(e) {
    let offset = e.endCoordinates.height;
    LayoutAnimation.configureNext({
      duration: isAndroid?250:e.duration,
      create: {
        type:     LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
      },
      update: { type: isAndroid?'linear':'keyboard' }
    });
    this.setState({height:this.listViewMaxHeight - offset,openOptions:false});
    /*Animated.timing(this.state.height, {
      toValue: this.listViewMaxHeight - e.endCoordinates.height,
      duration: 200,
    }).start();*/
  }

  onKeyboardDidShow(e) {
    if (Platform.OS === 'android') {
      this.onKeyboardWillShow(e);
    }

    setTimeout(() => {
      this.scrollToBottom();
    }, (Platform.OS === 'android' ? 200 : 100));
  }

  onLayout(event) {
    const layout = event.nativeEvent.layout;
    this._listHeight = layout.height;

    if (this._firstDisplay === true) {
      requestAnimationFrame(() => {
        this._firstDisplay = false;
        this.scrollToBottom(false);
      });
    }
  }

  onFooterLayout(event) {
    const layout = event.nativeEvent.layout;
    const oldFooterY = this._footerY;
    this._footerY = layout.y;

    if (this._scrollToBottomOnNextRender === true) {
      this._scrollToBottomOnNextRender = false;
      this.scrollToBottom();
    }

    if (this._scrollToPreviousPosition === true) {
      this._scrollToPreviousPosition = false;
      this.scrollResponder.scrollTo({
        y: this._footerY - oldFooterY,
        x: 0,
        animated: false,
      });
    }
  }

  onChangeVisibleRows(visibleRows) {
    this._visibleRows = visibleRows;
  }

  onChangeText(text) {
    this.setState({
      text,
      disabled: text.trim().length <= 0
    });

    this.props.onChangeText(text);
  }

  getLastMessageUniqueId() {
    if (this.props.messages.length > 0) {
      return this.props.messages[this.props.messages.length - 1].uniqueId;
    }
    return null;
  }

  getPreviousMessage(message) {
    for (let i = 0; i < this.props.messages.length; i++) {
      if (message.uniqueId === this.props.messages[i].uniqueId) {
        if (this.props.messages[i - 1]) {
          return this.props.messages[i - 1];
        }
      }
    }
    return null;
  }

  getNextMessage(message) {
    for (let i = 0; i < this.props.messages.length; i++) {
      if (message.uniqueId === this.props.messages[i].uniqueId) {
        if (this.props.messages[i + 1]) {
          return this.props.messages[i + 1];
        }
      }
    }
    return null;
  }

  setMessages(messages, isAppended = null) {
    this.filterStatus(messages);

    const rows = {};
    const identities = [];
    for (let i = messages.length-1; i >= 0; i--) {
      if (typeof messages[i].uniqueId === 'undefined') {
        console.warn('messages['+i+'].uniqueId is missing');
      }
      rows[messages[i].uniqueId] = Object.assign({}, messages[i]);
      identities.push(messages[i].uniqueId);
    }

    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(rows, identities),
    });

    if (isAppended === true) {
      this._scrollToBottomOnNextRender = true;
    } else if (isAppended === false) {
      this._scrollToPreviousPosition = true;
    }
  }

  // Keep only the status of the last 'right' message
  filterStatus(messages) {
    let lastStatusIndex = 0;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].position === 'right') {
        lastStatusIndex = i;
      }
    }

    for (let i = 0; i < lastStatusIndex; i++) {
      if (messages[i].position === 'right') {
        if (messages[i].status !== 'ErrorButton') {
          delete messages[i].status;
        }
      }
    }
  }


  isLastMessageVisible() {
    return !!this._visibleRows.s1[this.getLastMessageUniqueId()];
  }

  scrollToBottom(animated = null,offset = 0) {
    if (this._listHeight && this._footerY && this._footerY > this._listHeight) {
      let scrollDistance = this._listHeight - this._footerY;
      if (this.props.typingMessage)
        scrollDistance -= 44;
      scrollDistance += offset;
      
      this.scrollResponder.scrollTo({
        y: -scrollDistance,
        x: 0,
        animated: typeof animated === 'boolean' ? animated : this.props.scrollAnimated,
      });
    }
  }

  preLoadEarlierMessages() {
    this.props.onLoadEarlierMessages();
  }

  renderLoadEarlierMessages() {
    if (this.props.loadEarlierMessagesButton) {
      if (this.props.isLoadingEarlierMessages) {
        return (
          <View style={this.styles.loadEarlierMessages}>
            <GiftedSpinner />
          </View>
        );
      }
      return (
        <View style={this.styles.loadEarlierMessages}>
          <Button
            style={this.styles.loadEarlierMessagesButton}
            onPress={() => {this.preLoadEarlierMessages();}}>
            {this.props.loadEarlierMessagesButtonText}
          </Button>
        </View>
      );
    }
    return (
      <View style={ { height: 10 } } />
    );
  }

  renderTypingMessage() {
    if (this.props.typingMessage) {
      return (
        <View
          style={{
            height: 44,
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              marginLeft: 10,
              marginRight: 10,
              color: '#aaaaaa',
            }}
          >
            {this.props.typingMessage}
          </Text>
        </View>
      );
    }
    return null;
  }

  renderFooter() {
    return (
      <View
        onLayout={this.onFooterLayout}
      >
        {this.renderTypingMessage()}
      </View>
    );
  }

  renderDate(rowData = {}) {
    let diffMessage = null;
    diffMessage = this.getPreviousMessage(rowData);

    if (this.props.renderCustomDate) {
      return this.props.renderCustomDate(rowData, diffMessage)
    }

    if (rowData.date instanceof Date) {
      if (diffMessage === null) {
        return (
          <Text style={[this.styles.date]}>
            {moment(rowData.date).calendar()}
          </Text>
        );
      } else if (diffMessage.date instanceof Date) {
        const diff = moment(rowData.date).diff(moment(diffMessage.date), 'minutes');
        if (diff > 5) {
          return (
            <Text style={[this.styles.date]}>
              {moment(rowData.date).calendar()}
            </Text>
          );
        }
      }
    }
    return null;
  }

  renderRow(rowData = {}) {
    let diffMessage = null;
    let fromMe = rowData.position === 'right';
    diffMessage = this.getPreviousMessage(rowData);
    
    if(!!rowData.deal){
      let DealView = this.props.dealDisplay;
      return (
        <View key={rowData.uniqueId}>
          {this.renderDate(rowData)}
          <DealView
            navigator         ={this.props.navigator}
            key               ={rowData.uniqueId+'inner'}
            deal              ={rowData.deal}
            onErrorButtonPress={this.props.onErrorButtonPress}
            fromMe            ={fromMe}
            styles            ={this.styles}
          />
        </View>
      );
    }

    if(!!rowData.imageData){
      let ImgView = this.props.imageDisplay;
      return (
        <View key={rowData.uniqueId}>
          {this.renderDate(rowData)}
          <ImgView
            navigator         ={this.props.navigator}
            rowData           ={rowData}
            onImagePress      ={this.props.onImagePress}
            key               ={rowData.uniqueId+'inner'}
            imgData           ={rowData.imageData}
            imgWidth          ={rowData.width}
            imgHeight         ={rowData.height}
            zoomImage         ={this.props.zoomImage}
            loading           ={/\:/.test(rowData.uniqueId)}
            onErrorButtonPress={this.props.onErrorButtonPress}
            fromMe            ={fromMe}
            styles            ={this.styles} 
          />
        </View>
      );
    }

    if(!!rowData.text){
      return (
        <View key={rowData.uniqueId}>
          {this.renderDate(rowData)}
          <Message
            rowData={rowData}
            onErrorButtonPress={this.props.onErrorButtonPress}
            displayNames={this.props.displayNames}
            displayNamesInsideBubble={this.props.displayNamesInsideBubble}
            diffMessage={diffMessage}
            position={rowData.position}
            forceRenderImage={this.props.forceRenderImage}
            onImagePress={this.props.onImagePress}
            onMessageLongPress={this.props.onMessageLongPress}
            renderCustomText={this.props.renderCustomText}

            parseText={this.props.parseText}
            handlePhonePress={this.props.handlePhonePress}
            handleUrlPress={this.props.handleUrlPress}
            handleEmailPress={this.props.handleEmailPress}

            styles={this.styles}
          />
        </View>
      );
    }

    let UnsupportView = this.props.unsupportDisplay;
    return (
      <View key={rowData.uniqueId}>
          {this.renderDate(rowData)}
          <UnsupportView
            rowData={rowData}
            onImagePress={this.props.onImagePress}
            key={rowData.uniqueId+'inner'}
            fromMe={fromMe}
            styles={this.styles} 
          />
        </View>
    );
  }

  renderAnimatedView() {
    return (
      <View style={{ height: this.state.height }}>
        <ListView
          ref                  ="listView"
          renderScrollComponent={props => <InvertibleScrollView {...props} inverted />}
          dataSource           ={this.state.dataSource}
          renderRow            ={this.renderRow}
          renderHeader         ={this.renderFooter}
          enableEmptySections  ={true}
          onLayout             ={this.onLayout}
          renderFooter         ={this.renderLoadEarlierMessages}
          onChangeVisibleRows  ={this.onChangeVisibleRows}
          style                ={this.styles.listView}
          // not supported in Android - to fix this issue in Android, onKeyboardWillShow is called inside onKeyboardDidShow
          onKeyboardWillShow   ={this.onKeyboardWillShow}
          onKeyboardDidShow    ={this.onKeyboardDidShow}
          // not supported in Android - to fix this issue in Android, onKeyboardWillHide is called inside onKeyboardDidHide
          onKeyboardWillHide   ={this.onKeyboardWillHide}
          onKeyboardDidHide    ={this.onKeyboardDidHide}
          // @issue keyboardShouldPersistTaps={false} + textInput focused = 2 taps are needed to trigger the ParsedText links
          keyboardShouldPersistTaps={this.props.keyboardShouldPersistTaps}
          keyboardDismissMode  ={this.props.keyboardDismissMode}

          initialListSize      ={this.props.messages.length}
          pageSize             ={this.props.messages.length}

          {...this.props}
        />
      </View>
    );
  }

  setTextInputValue(text) {
    text = text || this.state.text
    this.setState({
      text,
      disabled: text.trim().length <= 0,
    });
  }

  renderButtonOptions(){
    if(!this.state.openOptions) return false;
    return (
        <View style={[this.styles.textInputWithButtons,{height:this.listViewMaxHeight - this.state.height}]}>
          {this.props.children}
        </View>
      );
  }

  renderTextInput() {
    if (this.props.hideTextInput === false) {
      /*
       <Button
            style={this.styles.sendButton}
            styleDisabled={this.styles.sendButtonDisabled}
            onPress={this.onSend}
            disabled={this.state.disabled}
          >
            {this.props.sendButtonText}
          </Button>
      */
      return (
        <View style={this.styles.textInputContainer}>
          {this.props.leftControlBar}
          <TextInput
            ref={(input)=>{this._input = input;}}
            style={this.styles.textInput}
            underlineColorAndroid={"transparent"}
            placeholder={this.props.placeholder}
            placeholderTextColor={this.props.placeholderTextColor}
            onChangeText={this.onChangeText}
            value={this.state.text}
            selectionColor={"#666"}
            underline
            autoFocus={this.props.autoFocus}
            returnKeyType={this.props.submitOnReturn ? 'send' : 'default'}
            onSubmitEditing={this.props.submitOnReturn ? this.onSend : () => {}}
            enablesReturnKeyAutomatically={true}
            blurOnSubmit={this.props.blurOnSubmit}
          />
          <TouchableOpacity onPress={()=>{this.onOpenPanel()}} activeOpacity={0.6}>
            <View style={this.styles.imgButton}>
              <Image source={{uri:'plus'}} style={this.styles.imgSrc} />
            </View>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }

  render() {
    return (
      <View style={this.styles.container}>
        {this.renderAnimatedView()}
        {this.renderTextInput()}
        {this.renderButtonOptions()}
      </View>
    );
  }
}

GiftedMessenger.defaultProps = {
  autoFocus: true,
  blurOnSubmit: false,
  dateLocale: '',
  displayNames: true,
  displayNamesInsideBubble: false,
  forceRenderImage: false,
  handleEmailPress: () => {},
  handlePhonePress: () => {},
  handleSend: () => {},
  handleUrlPress: () => {},
  handleImageSend:() => {},
  //zoomImage:() => {},
  hideTextInput: false,
  isLoadingEarlierMessages: false,
  keyboardDismissMode: 'interactive',
  keyboardShouldPersistTaps: false,
  leftControlBar: null,
  loadEarlierMessagesButton: false,
  loadEarlierMessagesButtonText: 'Load earlier messages',
  maxHeight: Dimensions.get('window').height,
  messages: [],
  onChangeText: () => {},
  onErrorButtonPress: () => {},
  onImagePress: null,
  onLoadEarlierMessages: () => {},
  onMessageLongPress: () => {},
  parseText: false,
  placeholder: 'Type a message...',
  placeholderTextColor: '#ccc',
  scrollAnimated: true,
  sendButtonText: 'Send',
  senderImage: null,
  senderName: 'Sender',
  styles: {},
  submitOnReturn: false,
  text: '',
  typingMessage: '',
  dealDisplay:null,
  imageDisplay:null
};

GiftedMessenger.propTypes = {
  autoFocus: React.PropTypes.bool,
  blurOnSubmit: React.PropTypes.bool,
  dateLocale: React.PropTypes.string,
  displayNames: React.PropTypes.bool,
  displayNamesInsideBubble: React.PropTypes.bool,
  forceRenderImage: React.PropTypes.bool,
  handleEmailPress: React.PropTypes.func,
  handlePhonePress: React.PropTypes.func,

  handleSend: React.PropTypes.func,
  handleImageSend: React.PropTypes.func,
  zoomImage: React.PropTypes.func,

  handleUrlPress: React.PropTypes.func,
  hideTextInput: React.PropTypes.bool,
  isLoadingEarlierMessages: React.PropTypes.bool,
  keyboardDismissMode: React.PropTypes.string,
  keyboardShouldPersistTaps: React.PropTypes.bool,
  leftControlBar: React.PropTypes.element,
  loadEarlierMessagesButton: React.PropTypes.bool,
  loadEarlierMessagesButtonText: React.PropTypes.string,
  maxHeight: React.PropTypes.number,
  messages: React.PropTypes.array,
  onChangeText: React.PropTypes.func,
  onCustomSend: React.PropTypes.func,
  onErrorButtonPress: React.PropTypes.func,
  onImagePress: React.PropTypes.func,
  onLoadEarlierMessages: React.PropTypes.func,
  onMessageLongPress: React.PropTypes.func,
  parseText: React.PropTypes.bool,
  placeholder: React.PropTypes.string,
  placeholderTextColor: React.PropTypes.string,
  renderCustomText: React.PropTypes.func,
  renderCustomDate: React.PropTypes.func,
  scrollAnimated: React.PropTypes.bool,
  sendButtonText: React.PropTypes.string,
  senderImage: React.PropTypes.object,
  senderName: React.PropTypes.string,
  styles: React.PropTypes.object,
  submitOnReturn: React.PropTypes.bool,
  typingMessage: React.PropTypes.string,

  dealDisplay:     React.PropTypes.func,
  imageDisplay:    React.PropTypes.func,
  unsupportDisplay:React.PropTypes.func
};


module.exports = GiftedMessenger;
