
import classNames from 'classnames';

//定义键盘操作
const keyCodes = {
    ENTER: 13,
    ESCAPE: 27,
    UP: 38,
    DOWN: 40
};
//搜索模块
class DopSearchBlock extends React.Component{
    constructor(props) {
        super(props);
        if (!props.onChange) {
            throw new Error('You must supply a callback to `onChange`.');
        }
        let sug2=[];//默认推荐的搜索结果
        let sug=[];
        $.ajax({
            url: '/api_cms/restop/0?&appkey='+config.appkey,//推荐结果的url
            dataType: "json",
            async: false,
            data:{pagesize:10,page:1},
            success(data) {
                sug=data.objects;
                for (let i=0;i<sug.length;i++){
                    sug2[i]=sug[i].res_obj&&sug[i].res_obj.res_name;
                }
            }
        });
        this.state = this.initialState = {
            highlightedItem: -1,
            searchTerm: '',
            suggestions: sug2,
            value: ''
        };
    }
    componentDidMount() {
        if (this.props.autoFocus) {
            this.refs.input.focus();
        }
    }
    normalizeInput() {
        return this.state.value.toLowerCase().trim();
    }
    autosuggest() {
        const searchTerm = this.normalizeInput();
        if (!searchTerm) return;
        new Promise((resolve) => {
            this.props.onChange(searchTerm, resolve);
        }).then((suggestions) => {
                if (!this.state.value) return;
                this.setState({
                    highlightedItem: -1,
                    searchTerm,
                    suggestions
                });
            });
    }
    scroll(key) {
        const {highlightedItem: item, suggestions} = this.state;
        const lastItem = suggestions.length - 1;
        let nextItem;

        if (key === keyCodes.UP) {
            nextItem = (item <= 0) ? lastItem : item - 1;
        } else {
            nextItem = (item === lastItem) ? 0 : item + 1;
        }

        this.setState({
            highlightedItem: nextItem,
            value: suggestions[nextItem]
        });
    }
    search() {
        if (!this.state.value) return;
        const value = this.normalizeInput();
        clearTimeout(this.timer);
        this.refs.input.blur();
        const {highlightedItem, suggestions} = this.initialState;
        this.setState({highlightedItem, suggestions});
        if (this.props.onSearch) {
            this.props.onSearch(value);
        }
    }
    onChange(e) {
        clearTimeout(this.timer);
        const input = e.target.value;
        if (!input) return this.setState(this.initialState);
        this.setState({value: input});
        this.timer = setTimeout(() => this.autosuggest(), this.props.delay);
    }
    onKeyDown(e) {
        const key = e.which || e.keyCode;
        switch (key) {
            case keyCodes.UP:
            case keyCodes.DOWN:
                e.preventDefault();
                this.scroll(key);
                break;

            case keyCodes.ENTER:
                this.search();
                break;

            case keyCodes.ESCAPE:
                this.refs.input.blur();
                break;
        }
    }
    onSelection(suggestion) {
        this.setState({value: suggestion}, () => this.search());
    }
    onSearch(e) {
        e.preventDefault();
        this.search();
    }
    
    jumpTo(){
        let keyword;
        if(this.state.value!==''){
            keyword=this.state.value;
        }else{
            keyword=this.state.suggestions[0]
        }
        let href='search.html?search='+keyword;
        window.open(href)
    }
    render() {
        let placeholder='';
        if(!this.state.isFocused){
            placeholder=this.state.suggestions[0]
        }else{
            placeholder=''
        }
        return (
            <div className="dop-search-block">
                <div className={classNames(
                    'dop-search-field',
                    {'is-focused': this.state.isFocused},
                    {'has-suggestions': this.state.isFocused}
                )}>
                    <input
                        className="dop-search-block-input"
                        name={this.props.inputName}
                        type="text"
                        ref="input"
                        value={this.state.value?this.state.value:placeholder}
                        onChange={this.onChange.bind(this)}
                        onBlur={() => this.setState({isFocused: false})}
                        onKeyDown={this.state.suggestions && this.onKeyDown.bind(this)}
                        onFocus={() => this.setState({isFocused: true})} />
                    { this.state.value &&
                    <span
                        className="icon search-bar-clear"
                        onClick={() => this.setState(this.initialState)}>
                    </span> }
                    <span className="search-submit" onClick={this.jumpTo.bind(this)}></span>
                    <input
                        className="icon dop-search-block-submit"
                        type="submit"
                        onClick={this.onSearch.bind(this)}
                        value=""
                    />
                </div>
        { this.state.suggestions.length > 0 &&this.state.isFocused==true&&
        <Suggestions
            searchTerm={this.state.searchTerm}
            suggestions={this.state.suggestions}
            highlightedItem={this.state.highlightedItem}
            onSelection={this.onSelection.bind(this)} /> }
            </div>
        );
    }
}
//搜索模块属性
DopSearchBlock.propTypes = {
    autoFocus: React.PropTypes.bool,
    delay: React.PropTypes.number,
    inputName: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired,
    onSearch: React.PropTypes.func,
    placeholder: React.PropTypes.string
};
DopSearchBlock.defaultProps = {
    autoFocus: false,
    delay: 200
};
//下拉列表
class Suggestions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeItem: -1
        };
    }
    onTouchStart(index) {
        this.timer = setTimeout(() => {
            this.setState({activeItem: index});
        }, 500);
    }
    onTouchMove() {
        clearTimeout(this.timer);
        this.touchedMoved = true;
        this.setState({activeItem: -1});
    }
    onTouchEnd(suggestion) {
        if (!this.touchedMoved) {
            setTimeout(() => {
                this.props.onSelection(suggestion);
            }, 500);
        }
        this.touchedMoved = false;
    }
    render() {
        const {highlightedItem, suggestions} = this.props;
        const {activeItem} = this.state;
        return (
            <ul
                className="dop-search-block-suggestions"
                onMouseLeave={() => this.setState({activeItem: -1})}>
        {suggestions.map((suggestion, index) =>
                <li
                    className={classNames({
                        highlighted: highlightedItem === index || activeItem === index
                    })}
                    key={index}
                    onClick={() => this.props.onSelection(suggestion)}
                    onMouseEnter={() => this.setState({activeItem: index})}
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={() => this.onTouchStart(index)}
                    onTouchMove={() => this.onTouchMove()}
                    onTouchEnd={() => this.onTouchEnd(suggestion)}>
                    <span>
                        <strong>{suggestion}</strong>
                    </span>
                </li>

        )}
            </ul>
        );
    }
}
//下拉列表属性
Suggestions.propTypes = {
    highlightedItem: React.PropTypes.number,
    searchTerm: React.PropTypes.string.isRequired,
    suggestions: React.PropTypes.array.isRequired
};
//搜索组件
const DopSearch = React.createClass({
    onChange(input, resolve) {
        let matches=[];
        let result=[];
        $.ajax({
            url: '/api_cms/search?restype=liveurl,series,transcoded&resname='+encodeURI(input)+'&appkey='+config.appkey,
            dataType: "json",
            async: false,
            data: {pagesize: 10, page: 1},
            success(data) {
                result = data.objects;
                for (let i=0;i<result.length;i++){
                    matches[i]=result[i].res_name;
                }
            }
        });
        setTimeout(() => {
            const suggestions=[]
            for (let i=0;i<matches.length;i++){
                suggestions[i]=matches[i].replace(new RegExp("\<(.*)\>"),input);
                sort(suggestions);
            }
            resolve(suggestions.filter((suggestion) =>
                    suggestion.match(new RegExp( input.replace('^[\u4E00-\u9FFF]+$'), 'i'))
            ));
        }, 500);
    },
    onSearch(input) {
        if (!input) return;
        let url='search.html?search='+input
        window.open(url)
    },
    render() {
        return (
            <DopSearchBlock
                onChange={this.onChange}
                onSearch={this.onSearch} />
        );
    }
});

export default DopSearch;

//排序算法：按文本长度排列
function sort (arr){
    var d;
    for (var i=0;i<arr.length;i++){
        for(var j=0;j<arr.length;j++){
            if(arr[i].length<arr[j].length){
                d=arr[j];
                arr[j]=arr[i];
                arr[i]=d;
            }
        }
    }
    return arr
}