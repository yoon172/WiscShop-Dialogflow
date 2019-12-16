const express = require('express');
const { WebhookClient } = require('dialogflow-fulfillment');
const app = express();
const fetch = require('node-fetch');
const base64 = require('base-64');

let username = "";
let password = "";
let token = "";

let tagArr = ["men", "women", "red", "white", "logo", "printed", "cotten",
  "polyester", "shortsleeve", "longsleeve", "shorts", "pants", "sweats",
  "hoodies", "grey", "youth", "adult", "embroidered", "black", "fuzzy",
  "badger", "pillow", "keychain", "visor"];

let teeObj = {
  "Jump Around Shirt" : 12
};
let plushesObj = {
  "Bucky Badger Plush" : 3,
  "Game Day Bucky Plush" : 5,
  "W Cloud Pillow" : 7,
  "Bucky Badger Pillow" : 8,
  "Bucky Badger Keychain" : 9,
};
let leggingsObj = {
  "Wisconsin Leggings" : 4,
  "Bucky Badger Leggings" : 6
};
let bottomsObj = {
  "Women's Wisconsin Cuddle Joggers" : 14,
  "Wisconsin Qualifier Woven Short" : 16,
  "Wisconsin Running Shorts" : 17,
  "Wisconsin Sweatpants" : 15
};
let hatsObj = {
  "Wisconsin Football Hat" : 10,
  "White Wisconsin Visor" : 11
};
let sweatshirtsObj = {
  "150 Year Commemorative Hoodie" : 13,
  "Bucky Crew Neck Sweatshirt" : 1
};

async function sendAgentMessage(message) {
  await fetch('https://mysqlcs639.cs.wisc.edu/application/messages/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify({
      "isUser":false,
      "text": message
    }),
  });
}

async function sendUserMessage(message) {
  await fetch('https://mysqlcs639.cs.wisc.edu/application/messages/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify({
      "isUser":true,
      "text": message
    }),
  });
}

async function deleteMessages() {
  await fetch('https://mysqlcs639.cs.wisc.edu/application/messages/', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    }
  });
}

/**
 * @return {boolean}
 */
async function PageStatus() {

  return await fetch('https://mysqlcs639.cs.wisc.edu/application', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  }).then((response) => response.json())
     .then((responseData) => {
       console.log(responseData);
       return responseData["page"] !== "/" + username;
     });
}

async function checkProductsPage() {

  return await fetch('https://mysqlcs639.cs.wisc.edu/application', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  }).then((response) => response.json())
     .then((responseData) => {
       console.log(responseData);
       let urlString = responseData["page"];
       let position = urlString.search("products");
       let id;
       if(position !== -1) {
         return urlString.substring(position+9, urlString.length);
       }
       return -1;
     });
}

async function getToken () {
  let request = {
    method: 'GET',
    headers: {'Content-Type': 'application/json',
              'Authorization': 'Basic '+ base64.encode(username + ':' + password)},
    redirect: 'follow'
  };

  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/login',request);
  const serverResponse = await serverReturn.json();
  token = serverResponse.token;

  return token;
}

app.get('/', (req, res) => res.send('online'));
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });


  /**************** Actions ************************/
  async function addFilterTags() {
    await sendUserMessage(agent.query);
    let tag = agent.parameters.tags;
    let isValid = false;
    for (let i = 0; i < tagArr.length; i++) {
      if(tagArr[i] === tag) {
        isValid = true;
        break;
      }
    }

    if(isValid) {
      let url = "https://mysqlcs639.cs.wisc.edu/application/tags/" + tag;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
      });
      let alertMessage = "Tag " + tag + " added!";
      agent.add(alertMessage);
      await sendAgentMessage(alertMessage);
    } else {
      let errorMessage = "Not a valid tag. Please try again.";
      agent.add(errorMessage);
      await sendAgentMessage(errorMessage);
    }
  }

  async function deleteFilterTags() {
    await sendUserMessage(agent.query);
    let tag = agent.parameters.tags;
    let isValid = false;
    for (let i = 0; i < tagArr.length; i++) {
      if(tagArr[i] === tag) {
        isValid = true;
        break;
      }
    }

    if(isValid) {
      let url = "https://mysqlcs639.cs.wisc.edu/application/tags/" + tag;
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
      });
      let alertMessage = "Tag " + tag + " deleted!";
      agent.add(alertMessage);
      await sendAgentMessage(alertMessage);
    } else {
      let errorMessage = "Not a valid tag. Please try again.";
      agent.add(errorMessage);
      await sendAgentMessage(errorMessage);
    }
  }

  async function clearCart () {
    await sendUserMessage(agent.query);
    let url = "https://mysqlcs639.cs.wisc.edu/application/products/";
    await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
    });
    let alertMessage = "Cart cleared!";
    agent.add(alertMessage);
    await sendAgentMessage(alertMessage);
  }

  async function addItems () {
      await sendUserMessage(agent.query);
      let id = await checkProductsPage();
      let quantity = agent.parameters.cardinal;
      if(agent.parameters.cardinal === undefined) {
        quantity = 1;
      }
      if(id !== -1) {
        for(let i = 0; i < quantity; i++) {
          let url = "https://mysqlcs639.cs.wisc.edu/application/products/" + id;
          await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': token,
            },
          });
        }
        let alertMessage = quantity + " items added to the cart!";
        agent.add(alertMessage);
        await sendAgentMessage(alertMessage);
      } else {
        let alertMessage = "Please go to a product page to add the product to the cart!";
        agent.add(alertMessage);
        await sendAgentMessage(alertMessage);
      }
  }

  async function removeItems () {
    await sendUserMessage(agent.query);
    let id = await checkProductsPage();
    let quantity = agent.parameters.cardinal;
    if(agent.parameters.cardinal === undefined) {
      quantity = 1;
    }
    if(id !== -1) {
      for(let i = 0; i < quantity; i++) {
        let url = "https://mysqlcs639.cs.wisc.edu/application/products/" + id;
        await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
          },
        });
      }
      let alertMessage = "Item(s) removed from cart";
      agent.add(alertMessage);
      await sendAgentMessage(alertMessage);
    } else {
      let alertMessage = "Please go to a product page to add the product to the cart!";
      agent.add(alertMessage);
      await sendAgentMessage(alertMessage);
    }
  }

  /*************************************************/


  /**************** Queries ************************/

  async function queryHat () {
    await sendUserMessage(agent.query);
    let isCategory = await PageStatus();
    if(isCategory) {
      let productId = hatsObj[agent.parameters.Hat];
      await fetch('https://mysqlcs639.cs.wisc.edu/application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({"page": "/" + username + "/hats/products/" + productId}),
      })
         .then((response) => response.json())
         .then((responseData) => {
           console.log(responseData);
         }).catch((error) => {
           console.log(error)
         });
      let successMessage = "You are now in the selected product page!";
      agent.add(successMessage);
      await sendAgentMessage(successMessage);
    } else {
      let errorMessage = "Please go into a category page before going into a product page! " +
         "To get into category page, please say \"Show me hats\"";
      agent.add(errorMessage);
      await sendAgentMessage(errorMessage);
    }
  }

  async function queryLeggings () {
    await sendUserMessage(agent.query);
    let isCategory = await PageStatus();
    if(isCategory) {
      let productId = leggingsObj[agent.parameters.Leggings];
      await fetch('https://mysqlcs639.cs.wisc.edu/application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({"page": "/" + username + "/leggings/products/" + productId}),
      })
         .then((response) => response.json())
         .then((responseData) => {
           console.log(responseData);
         }).catch((error) => {
           console.log(error)
         });
      let successMessage = "You are now in the selected product page!";
      agent.add(successMessage);
      await sendAgentMessage(successMessage);
    } else {
      let errorMessage = "Please go into a category page before going into a product page! " +
         "To get into category page, please say \"Show me hats\"";
      agent.add(errorMessage);
      await sendAgentMessage(errorMessage);
    }
  }

  async function queryPlushes () {
    await sendUserMessage(agent.query);
    let isCategory = await PageStatus();
    if(isCategory) {
      let productId = plushesObj[agent.parameters.Plushes];
      await fetch('https://mysqlcs639.cs.wisc.edu/application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({"page": "/" + username + "/plushes/products/" + productId}),
      })
         .then((response) => response.json())
         .then((responseData) => {
           console.log(responseData);
         }).catch((error) => {
           console.log(error)
         });
      let successMessage = "You are now in the selected product page!";
      agent.add(successMessage);
      await sendAgentMessage(successMessage);
    } else {
      let errorMessage = "Please go into a category page before going into a product page! " +
         "To get into category page, please say \"Show me hats\"";
      agent.add(errorMessage);
      await sendAgentMessage(errorMessage);
    }
  }

  async function querySweatshirt () {
    await sendUserMessage(agent.query);
    let isCategory = await PageStatus();
    if(isCategory) {
      let productId = sweatshirtsObj[agent.parameters.Sweatshirts];
      await fetch('https://mysqlcs639.cs.wisc.edu/application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({"page": "/" + username + "/sweatshirts/products/" + productId}),
      })
         .then((response) => response.json())
         .then((responseData) => {
           console.log(responseData);
         }).catch((error) => {
           console.log(error)
         });
      let successMessage = "You are now in the selected product page!";
      agent.add(successMessage);
      await sendAgentMessage(successMessage);
    } else {
      let errorMessage = "Please go into a category page before going into a product page! " +
         "To get into category page, please say \"Show me hats\"";
      agent.add(errorMessage);
      await sendAgentMessage(errorMessage);
    }
  }

  async function queryTee () {
    await sendUserMessage(agent.query);
    let isCategory = await PageStatus();
    if(isCategory) {
      let productId = teeObj[agent.parameters.Tees];
      await fetch('https://mysqlcs639.cs.wisc.edu/application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({"page": "/" + username + "/tees/products/" + productId}),
      })
         .then((response) => response.json())
         .then((responseData) => {
           console.log(responseData);
         }).catch((error) => {
           console.log(error)
         });
      let successMessage = "You are now in the selected product page!";
      agent.add(successMessage);
      await sendAgentMessage(successMessage);
    } else {
      let errorMessage = "Please go into a category page before going into a product page! " +
         "To get into category page, please say \"Show me hats\"";
      agent.add(errorMessage);
      await sendAgentMessage(errorMessage);
    }
  }

  async function queryBottoms () {
    await sendUserMessage(agent.query);
    let isCategory = await PageStatus();
    if(isCategory) {
      let productId = bottomsObj[agent.parameters.Bottoms];
      await fetch('https://mysqlcs639.cs.wisc.edu/application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({"page": "/" + username + "/bottoms/products/" + productId}),
      })
         .then((response) => response.json())
         .then((responseData) => {
           console.log(responseData);
         }).catch((error) => {
           console.log(error)
         });
      let successMessage = "You are now in the selected product page!";
      agent.add(successMessage);
      await sendAgentMessage(successMessage);
    } else {
      let errorMessage = "Please go into a category page before going into a product page! " +
         "To get into category page, please say \"Show me hats\"";
      agent.add(errorMessage);
      await sendAgentMessage(errorMessage);
    }
  }

  async function itemDetailQuery() {
    await sendUserMessage(agent.query);
    let id = await checkProductsPage();
    let detail = agent.parameters.itemdetails;

    if(id !== -1) {
        let url = "https://mysqlcs639.cs.wisc.edu/products/" + id +"/reviews";
        await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
           .then((response) => response.json())
           .then((responseData) => {
             parseDetails(responseData);
           }).catch((error) => {
             console.log(error)
           });
    } else {
      let alertMessage = "Please go to a product page to view reviews for a product!";
      agent.add(alertMessage);
      await sendAgentMessage(alertMessage);
    }
  }

  async function parseDetails (responseData) {
    let reviewArr = responseData["reviews"];
    let reviewString = "Reviews:\n";
    let ratingsSum = 0;

    for(let i = 0; i < reviewArr.length; i++) {
      reviewString += reviewArr[i].title + "\n";
      reviewString += reviewArr[i].text + "\n";
      ratingsSum += reviewArr[i].stars;
    }
    ratingsSum /= reviewArr.length;

    reviewString += "\n"+ "Average rating: " + ratingsSum;

    agent.add(reviewString);
    await sendAgentMessage(reviewString);
  }

  async function queryCart () {
    let parseKeyword = agent.parameters.cartquerykeywords;
    await sendUserMessage(agent.query);
    await fetch('https://mysqlcs639.cs.wisc.edu/application/products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
    })
       .then((response) => response.json())
       .then((responseData) => {
         parseCartItems(responseData, parseKeyword);
       }).catch((error) => {
         console.log(error)
       });
  }

  async function parseCartItems(responseData, parseKeyword) {
    let productArr = responseData["products"];
    let outputString;
    if(parseKeyword === "types"){
      outputString = "There are currently ";
      for(let i = 0; i < productArr.length - 1; i++) {
        outputString += productArr[i].category + ", "
      }
      outputString += productArr[productArr.length - 1].category + " items in the cart!";

    }
    else if(parseKeyword === "number"){
      outputString = "There currently a total of ";
      let counter = 0;
      for(let i = 0; i < productArr.length; i++) {
        counter += productArr[i].count;
      }
      outputString += counter +"  items in the cart right now."
    }
    else if(parseKeyword === "value"){
      outputString = "The total cost of the cart right now is ";
      let counter = 0;
      for(let i = 0; i < productArr.length; i++) {
        counter += productArr[i].price;
      }
      outputString += "$" + counter;
    }

    else if(parseKeyword === "names"){
      outputString = "The items in the cart right now are ";
      for(let i = 0; i < productArr.length - 1; i++) {
        outputString += productArr[i].name + ", "
      }
      outputString += "and " + productArr[productArr.length - 1].name;
    }

    agent.add(outputString);
    await sendAgentMessage(outputString);
  }

  async function queryCategory() {
    await sendUserMessage(agent.query);
    await fetch('https://mysqlcs639.cs.wisc.edu/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
       .then((response) => response.json())
       .then((responseData) => {
         parseCategories(responseData);
       }).catch((error) => {
         console.log(error)
       });
  }

  async function parseCategories(responseData) {
    let categoryArr = responseData["categories"];
    let outputString = "There are ";
    for (let i = 0; i < categoryArr.length - 1; i++) {
      outputString += categoryArr[i] + ", ";
    }
    outputString += "and " + categoryArr[categoryArr.length - 1];
    outputString += " product categories available on this website";

    agent.add(outputString);
    await sendAgentMessage(outputString);
  }

  async function queryCategoryTags() {
    await sendUserMessage(agent.query);
    let category = agent.parameters.categories;
    let url = "https://mysqlcs639.cs.wisc.edu/categories" + "/" + category + "/tags";
    console.log(url);
    await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
       .then((response) => response.json())
       .then((responseData) => {
         parseCategoriesTags(responseData, category);
       }).catch((error) => {
         console.log(error)
       });
  }

  async function parseCategoriesTags(responseData, category) {
    let categoryArr = responseData["tags"];
    let outputString = "There are ";
    for (let i = 0; i < categoryArr.length - 1; i++) {
      outputString += categoryArr[i] + ", ";
    }
    outputString += "and " + categoryArr[categoryArr.length - 1];
    outputString += " tags available for category " + category;

    agent.add(outputString);
    await sendAgentMessage(outputString);
  }



  /***************** Navigation ************************/
  async function navigation() {
    let category = agent.parameters.category;
    if (category === "homepage") {
      category = "";
    }
    if(category === "back") {
      category = "";
    }
      await fetch('https://mysqlcs639.cs.wisc.edu/application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({"page": "/" + username + "/" + category}),
      })
      .then((response) => response.json())
         .then((responseData) => {
           console.log(responseData);
         }).catch((error) => {
           console.log(error)
         });
      await sendUserMessage(agent.query);
      if(category === "") {
        category = "home";
      }
      let outputMessage = "You are now in the " + category + " page!";
      await sendAgentMessage(outputMessage);
      agent.add(outputMessage);

    }

/********************************************************/

/********************* Login ***************************/

  async function login () {
    username = agent.parameters.username;
    password = agent.parameters.password;
    token = await getToken();
    await deleteMessages();
    await sendUserMessage(agent.query);
    await fetch('https://mysqlcs639.cs.wisc.edu/application', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      body: JSON.stringify({"page": "/" + username}),
    }).then((response) => response.json())
       .then((responseData) => {
         console.log(responseData);
       }).catch((error) => {
         console.log(error)
       });
    let agentMessage = "Successful! You are now logged in as " + username;
    await sendAgentMessage(agentMessage);
    if(token !== "") {
      agent.add(agentMessage);
    } else {
      agent.add("Wrong username/password");
    }
  }

/*****************************************************/


  let intentMap = new Map();
  intentMap.set('Login', login);
  intentMap.set('navigation', navigation);
  intentMap.set('query category', queryCategory);
  intentMap.set('query category tags', queryCategoryTags);
  intentMap.set('query cart', queryCart);
  intentMap.set('query hat', queryHat);
  intentMap.set('query leggings', queryLeggings);
  intentMap.set('query plushes', queryPlushes);
  intentMap.set('query sweatshirt', querySweatshirt);
  intentMap.set('query tees', queryTee);
  intentMap.set('query bottoms', queryBottoms);
  intentMap.set('add filter tags', addFilterTags);
  intentMap.set('delete filter tags', deleteFilterTags);
  intentMap.set('clear cart', clearCart);
  intentMap.set('add item', addItems);
  intentMap.set('remove item', removeItems);
  intentMap.set('item detail query', itemDetailQuery);
  agent.handleRequest(intentMap)
});

app.listen(process.env.PORT || 8080);


