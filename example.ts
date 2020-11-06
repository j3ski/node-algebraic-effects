import { handle, perform } from "./src";

type User = {
  name?: string;
  friendNames: string[];
};

const wait = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

const getName = async (user: User): Promise<string> => {
  if (user.name) {
    return user.name;
  }
  return perform("ask_name") as Promise<string>;
};

const makeFriends = async (user1: User, user2: User) => {
  await perform("log", "making friends between", user1.name, "and", user2.name);
  user1.friendNames.push(await getName(user2));
  user2.friendNames.push(await getName(user1));
  await perform("log", "done making friends");
};

const getCharacters = (): [User, User] => [
  {
    friendNames: ["Bran"],
  },
  {
    name: "Gendry",
    friendNames: [],
  },
];

const syncResponse = async () => {
  console.log("We will immediately ask for the name");
  const charaters = getCharacters();

  await handle(() => makeFriends(...charaters), {
    ask_name: () => "Arya Stark",
    log: console.log,
  });

  console.log("Now they are friends!", charaters);
};

const asyncResponse = async () => {
  console.log("We will need to send a crow for this one");
  const charaters = getCharacters();

  await handle(() => makeFriends(...charaters), {
    ask_name: async () => {
      console.log("sending the crow!");
      await wait(1000);
      console.log("the crow returned!");
      return "Arya Stark";
    },
    log: () => {}, // no logging here. Still need to handle the effect
  });

  console.log("this took a while, but here they are!", charaters);
};

const feedTheCrow = async () => {
  console.log("We need to feed the crow after we're done!");
  const characters = getCharacters();

  await handle(
    () => makeFriends(...characters),
    async (resume, effect, ...args) => {
      if (effect === "ask_name") {
        console.log("sending the crow!");
        await wait(100);
        console.log("The crow returned real quick!");
        await resume("Arya Start");
        console.log("now that we are done, let's feed the crow!");
      }
      if (effect === "log") {
        console.log(...args);
        resume();
      }
    }
  );

  console.log("I hope we remembered to feed the crow...");
};

const main = async () => {
  console.log("### EXAMPLE 1 ###");
  await syncResponse();
  console.log("### EXAMPLE 2 ###");
  await asyncResponse();
  console.log("### EXAMPLE 3 ###");
  await feedTheCrow();
};

main();
