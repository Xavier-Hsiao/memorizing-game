//遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished"
}


//由於此常數儲存的資料不會變動，因此習慣上將首字母大寫以表示此特性
const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]

const view = {
  //getCardBackElement負責渲染牌背元素
  getCardBackElement(index) {
    //由於遊戲開始時的預設是牌背朝上，所以利用data-index把index藏起來
    return `<div class="card back" data-index="${index}"></div>`
  },
  // 負責生成卡片正面內容，包含花色、數字等
  getCardContent(index) {
    // 0-12：黑桃 1-13
    // 13-25：愛心 1-13
    // 26-38：方塊 1-13
    // 39-51：梅花 1-13
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" alt="card-symbol">
      <p>${number}</p>`
  },
  //負責處理A、J、Q、K的數字轉換
  transformNumber(number) {
    switch(number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number        
    }
  },
  // 負責選出 #card 並抽換內容
  displayCards(cardArray) {
    const rootElement = document.querySelector('#cards')
    //先製作一個Array，裡面有52個空洞(index 0~51)，利用keys()取得這個Array的迭代器，所以現在我們有了一個index 0~51的迭代器了 => Array(52).keys。接下來我們再創立另一個空白的Array，利用from()拿取迭代器 
    rootElement.innerHTML = cardArray.map(index => this.getCardBackElement(index)).join('')
  },
  //翻牌邏輯，因為不確定傳入的參數會有幾個(可能一張卡或兩張卡)，所以利用rest parameter，把多個參數納進一個Array中
  flipCards(...cards) {
    //利用map()來迭代，無論參數有幾個
    cards.map(card => {
      // 點擊一張覆蓋的卡片 → 回傳牌面內容 (數字和花色)
      if(card.classList.contains('back')) {
        // 回傳正面內容
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      // 回傳牌背
      card.classList.add('back')
      card.innerHTML = null
    })   
  },

  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })    
  },

  renderScore(score) {
    document.querySelector('.score').innerText = `Score: ${score}`
  },

  renderTriedTimes(time) {
    document.querySelector('.tried').innerText = `You've tried ${time} times`
  },

  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => {
        // 最後的 {once: true} 是要求在事件執行一次之後，就要卸載這個監聽器。因為同一張卡片可能會被點錯好幾次，每一次都需要動態地掛上一個新的監聽器，並且用完就要卸載。
        event.target.classList.remove('wrong'), {once: true}
      })
    })
  },

  displayGameOver() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Completed!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    // The Element.before() method inserts a set of Node or DOMString objects in the children list of this Element's parent, just before this Element.
    header.before(div)
  }
}

const model = {
  // 代表一個暫存牌組，使用者每次翻牌時，就先把卡片丟進這個牌組，集滿兩張牌時就要檢查配對有沒有成功，檢查完以後，這個暫存牌組就需要清空~
  revealedCards: [],

  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,
  triedTimes: 0
}

const controller = {
  //初始遊戲狀態設定為等待第一張翻牌
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  dispatchCardAction(card) {
    //確認點到的牌是否牌背朝上
    if(!card.classList.contains('back')) {
      return
    }
     
    switch(this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        //判斷是否配對成功
        if(model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          // 如果分數到達260代表所有排組配對成功，遊戲結束~
          if(model.score === 260) {
            this.currentState = GAME_STATE.GameFinished
            view.displayGameOver()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對失敗，利用setTimeout()產生停頓1秒的效果
          this.currentState = GAME_STATE.CardsMatchFailed
          // 增加配對失敗的動畫效果
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.restCards, 1000)
        }
        break
    }
    console.log('current state is:', this.currentState)
    console.log('revealed cards are:', model.revealedCards.map(card => card.dataset.index))
  },

  restCards() {
    console.log('reset')
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    //注意這邊是controller.currentState而非this.currentState，因為當我們把resetCards這個function當作參數丟進去setTimeout()時，this就不會指向controller，而是會指向setTimeout，而setTimeout本身又是個瀏覽器提供的function，不是我們在controller物件中定義的function~
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

//Fisher Yates shuffle logic
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for(let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
      ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }

    return number
  }
}
controller.generateCards()
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})