const Pixels = (() => {
  "use strict";
  const dark = "#171521";
  const gold = "#f7bb4b";
  const cream = "#ffe39c";
  const lime = "#c4fb63";
  const violet = "#d2b0ff";
  const aqua = "#a0f6de";

  // Draw on a 24-pixel grid and let the browser scale the finished sprite.
  function paint(name, fill, ink = "#e3e7de") {
    const rect = (x, y, w, h, color = ink) => fill(x, y, w, h, color);
    const path = (points, color = ink, width = 2) => {
      for (let i = 2; i < points.length; i += 2) {
        const x = points[i - 2], y = points[i - 1];
        const dx = points[i] - x, dy = points[i + 1] - y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
        for (let j = 0; j <= steps; j++) {
          rect(Math.round(x + dx * j / steps), Math.round(y + dy * j / steps), width, width, color);
        }
      }
    };
    const polygon = (points, color) => {
      for (let y = 0; y < 24; y++) {
        const cuts = [];
        for (let i = 0; i < points.length; i += 2) {
          const k = (i + 2) % points.length;
          const x1 = points[i], y1 = points[i + 1], x2 = points[k], y2 = points[k + 1];
          if ((y1 > y + .5) !== (y2 > y + .5)) cuts.push(x1 + (y + .5 - y1) * (x2 - x1) / (y2 - y1));
        }
        cuts.sort((a, b) => a - b);
        for (let i = 0; i < cuts.length; i += 2) {
          const start = Math.ceil(cuts[i] - .5);
          rect(start, y, Math.ceil(cuts[i + 1] - .5) - start, 1, color);
        }
      }
    };
    const coin = (x, y, w, h, edge, face, light) => {
      polygon([x+3,y, x+w-3,y, x+w,y+3, x+w,y+h-3, x+w-3,y+h, x+3,y+h, x,y+h-3, x,y+3], edge);
      polygon([x+3,y+1, x+w-4,y+1, x+w-2,y+3, x+w-2,y+h-4, x+w-4,y+h-2, x+3,y+h-2, x+1,y+h-4, x+1,y+3], face);
      path([x+2,y+5, x+2,y+3, x+4,y+1, x+w-5,y+1], light, 1);
    };
    const note = (x, y, main = "#8de265", line = "#365a3b") => {
      rect(x,y,19,11,line); rect(x+1,y+1,17,9,main);
      path([x+2,y+3, x+4,y+3, x+4,y+2, x+14,y+2, x+14,y+3, x+16,y+3, x+16,y+7, x+14,y+7, x+14,y+8, x+4,y+8, x+4,y+7, x+2,y+7, x+2,y+3],line,1);
      rect(x+8,y+3,3,5,line); rect(x+7,y+4,5,3,line); rect(x+9,y+4,1,3,main);
    };
    const paw = (x, y, color) => {
      rect(x,y+2,2,2,color); rect(x+2,y,2,2,color); rect(x+5,y,2,2,color); rect(x+7,y+2,2,2,color);
      rect(x+3,y+3,3,2,color); rect(x+2,y+5,5,2,color);
    };
    switch (name) {
      case "paw-coin":
        coin(3,3,18,18,"#99623a",gold,cream); paw(8,8,"#92602e"); break;
      case "ox-charm":
        path([9,6,7,4,8,2,11,2,13,4,12,6],"#d6d7dd",1); rect(11,5,2,3,"#9aa1ad");
        polygon([3,6,6,9,9,8,15,8,18,9,21,6,20,12,17,14,17,18,14,21,9,21,6,18,6,14,3,12],"#c78856");
        path([3,7,4,10,6,11],cream,1); path([20,7,19,10,17,11],cream,1);
        rect(8,12,2,2,dark); rect(14,12,2,2,dark); rect(8,16,8,3,"#f3b098");
        rect(9,17,1,1,dark); rect(14,17,1,1,dark); break;
      case "ox-bank":
        polygon([2,10,6,6,16,6,19,8,21,9,23,10,23,15,20,16,18,18,17,21,14,21,14,18,8,18,8,21,5,21,4,17,2,15],gold);
        path([16,8,17,4,19,7],cream,1); path([19,8,21,5,21,9],cream,1);
        rect(7,7,6,1,"#815c3a"); rect(3,11,2,3,cream); rect(18,10,2,2,dark);
        rect(20,13,3,2,"#df8b52"); rect(6,16,9,1,"#d18e43"); break;
      case "chop-bun":
      case "burger": {
        const burger = name === "burger";
        polygon([3,10,5,6,9,4,15,4,19,6,21,10,21,12,3,12],"#eab672");
        rect(8,6,3,1,cream); rect(13,5,2,1,cream); rect(16,8,2,1,cream);
        polygon([2,12,22,12,22,15,19,16,3,16,1,14],"#955442");
        rect(5,13,7,1,"#cb7e54");
        if (burger) {
          path([3,11,6,12,9,11,12,12,15,11,18,12,20,11],"#a5ce6d",1);
          polygon([4,15,20,15,15,18,12,16,4,17],gold); rect(4,17,16,1,"#805043");
        }
        const y = burger ? 18 : 16;
        polygon([3,y,21,y,20,y+2,17,y+3,7,y+3,4,y+2],"#e7a465"); break;
      }
      case "cookie-tin":
        polygon([2,9,5,6,18,6,22,9,22,17,18,20,6,20,2,17],"#b55760");
        rect(4,13,16,5,"#cb7174"); rect(7,16,10,1,cream);
        polygon([2,8,5,5,18,5,22,8,22,12,19,14,5,14,2,12],"#f3b893");
        polygon([4,8,7,6,17,6,20,8,20,11,17,12,7,12,4,11],"#bc7155");
        polygon([7,8,11,7,14,9,13,11,8,11],"#f1c578"); rect(9,9,2,1,"#a06e45");
        rect(15,8,3,2,"#e7b571"); break;
      case "postcard":
        rect(1,5,21,15,"#a78d7a"); rect(1,4,21,15,"#f6e6bf"); rect(3,6,17,10,"#8dcbd7");
        rect(15,7,3,3,"#ffd88a"); polygon([3,14,8,9,12,13,14,11,20,15,20,16,3,16],"#5caa92");
        rect(5,15,13,1,"#7fc6c0"); rect(13,17,6,1,"#bd8c74"); break;
      case "snack-map":
        polygon([2,6,8,3,15,6,21,3,22,18,16,21,9,18,3,21],"#f0d192");
        polygon([8,3,15,6,16,21,9,18],"#d7aa73");
        path([3,13,6,11,9,12,12,10,15,11,20,8],"#8dbdc7",2);
        path([5,16,8,14,10,15,15,11],"#9b775b",1);
        polygon([13,7,15,5,18,5,20,7,20,9,16,14,13,10],"#cd6262"); rect(15,7,2,2,cream); break;
      case "crepe-roll":
        polygon([2,15,4,12,14,5,17,4,21,7,21,11,9,20,5,20,2,18],"#dfad60");
        polygon([3,14,14,6,17,5,20,7,8,16],"#ffdc8a");
        path([6,13,8,16,8,18],"#a4704d",1); path([11,9,14,11,14,14],"#bf884e",1);
        rect(4,16,3,2,"#ffe6a4"); rect(4,17,2,1,"#f3a24d"); rect(16,8,2,1,"#8dab65"); break;
      case "cutlet":
        polygon([4,11,5,6,9,3,14,3,19,7,20,12,18,17,8,19,4,15],"#bd7549");
        polygon([5,10,7,6,10,4,14,5,18,8,18,13,14,16,8,16],"#edaa60");
        for (const [x,y] of [[7,8],[11,6],[14,8],[10,11],[16,11]]) rect(x,y,2,1,"#ad6546");
        polygon([3,13,9,15,20,12,17,20,10,23,5,20],"#f2dfba"); path([5,16,10,18,16,16],"#e59480",1); break;
      case "noodles":
        path([14,9,19,2],"#d8a371",1); path([17,9,22,3],"#edc294",1);
        polygon([2,11,5,9,19,9,22,11,21,15,17,19,7,19,3,16],"#78b9bb");
        rect(4,11,16,3,"#aa7051"); path([6,11,8,12,10,11,12,12,14,11],cream,1);
        rect(14,10,5,3,"#f2dec0"); rect(16,11,2,2,gold); rect(5,10,2,1,"#9cbd76");
        rect(5,15,14,1,"#bbded3"); rect(8,19,8,2,"#66999e"); break;
      case "paw-cake":
        polygon([3,10,5,7,8,7,9,4,12,4,13,6,15,4,18,5,19,8,21,8,22,11,20,14,18,16,18,19,15,21,8,21,5,18,6,15,3,13],"#f6dcc5");
        paw(8,8,"#e59e9e"); break;
      case "blue-coffee":
        polygon([4,6,20,6,18,22,7,22],"#658fbb"); rect(4,4,16,3,"#fcf1d0"); rect(5,4,14,1,"#8f6c56");
        rect(6,8,13,2,"#dfd9ae"); rect(7,18,11,2,"#dcdbb9");
        path([9,15,9,12,11,12,11,14,13,14,13,12,15,12,15,15],cream,1); break;
      case "bagel":
        polygon([2,10,5,6,10,4,15,4,20,7,22,11,21,16,16,19,8,20,3,17],"#ae704d");
        polygon([3,10,6,7,10,5,15,5,19,8,20,12,17,15,11,17,6,16,3,13],"#e3a25f");
        polygon([9,10,11,8,14,8,16,10,14,12,11,13,9,12],"#745345"); rect(11,10,3,1,dark);
        for (const [x,y] of [[5,10],[8,8],[11,6],[17,8],[18,11],[16,14],[7,14]]) rect(x,y,2,1,cream);
        rect(6,12,1,1,dark); rect(13,6,1,1,dark); rect(12,15,1,1,dark); break;
      case "pretzel": {
        const twist = [5,17,11,13,15,6,18,5,20,6,20,10,17,15,13,18,9,18,5,15,2,10,2,7,4,5,7,5,10,9,14,14,18,17];
        path(twist,"#a26843",3); path(twist,"#e9ab65",2);
        for (const [x,y] of [[4,6],[7,7],[16,6],[19,9],[13,13],[7,17]]) rect(x,y,1,1,"#fff1d3");
        break;
      }
      case "playbill":
        rect(4,3,16,19,"#946062"); rect(3,2,16,19,"#efe1c1"); rect(4,3,14,4,"#f6c953");
        rect(6,4,10,1,"#7e5246"); rect(5,8,12,10,"#563c58");
        polygon([5,8,10,8,8,12,6,14,5,14],"#ce6d71"); polygon([12,8,17,8,17,14,15,13],"#d97d75");
        rect(10,11,2,3,cream); rect(9,14,4,2,"#b6b1cc"); path([10,19,12,18,13,19,16,18],"#987a76",1); break;
      case "bag":
        rect(9,1,7,2,"#b19adf"); rect(8,3,2,2,"#9272c7"); rect(15,3,2,2,"#9272c7");
        polygon([6,4,17,4,20,7,20,12,22,14,22,19,19,22,5,22,2,19,2,14,4,12,4,7],"#54416c");
        polygon([6,5,16,5,19,8,19,18,17,20,6,20,4,18,4,8],"#9974ce");
        polygon([7,5,16,5,18,7,18,10,16,12,7,12,5,10,5,7],"#c8a1f4");
        rect(7,6,8,1,"#f4d6ff"); rect(6,14,11,4,"#68508d"); rect(7,18,9,1,"#b698d8");
        rect(10,10,4,4,"#714e42"); rect(10,10,4,2,"#ffe49a"); rect(11,12,2,1,"#f2b15b"); break;
      case "globe":
        path([7,2,15,2,20,7,20,15,15,20,7,20,2,15,2,7,7,2]);
        path([11,3,8,7,8,15,11,19,14,15,14,7,11,3],ink,1);
        rect(3,10,17,2); break;
      case "location":
        polygon([8,1,15,1,20,6,20,11,12,22,4,11,4,6],ink);
        rect(9,6,6,5,"#25252a"); break;
      case "brand":
        rect(1,7,6,2,"#bded69"); rect(0,11,5,2,"#e8f8bb"); rect(2,15,4,2,"#91b44b");
        coin(6,2,17,20,"#a96d21",gold,cream);
        path([10,6,13,4,17,4,20,7,20,15,17,18,12,18,9,15,9,8], "#c78c32",1);
        path([17,8,13,8,12,9,12,10,16,11,17,12,17,13,16,14,12,14], "#624620",1);
        rect(14,6,1,2,"#624620"); rect(14,15,1,2,"#624620"); break;
      case "bars":
        rect(2,14,4,6,lime); rect(9,9,4,11,lime); rect(16,4,4,16,lime); break;
      case "cash":
        note(2,9,"#679b52","#324936"); note(3,7,"#b3df72","#416140"); note(2,4,"#c4f57c","#426940");
        rect(4,5,4,1,"#efffba"); break;
      case "stash":
        rect(2,12,13,8,"#427b70"); rect(3,11,10,2,"#caffea"); rect(3,14,10,2,"#86e5be"); rect(3,18,10,1,"#7cbfaf");
        rect(9,7,13,12,"#497e73"); rect(8,5,13,3,"#caffea");
        rect(7,7,14,3,"#8de2be"); rect(8,10,12,1,"#41655f"); rect(9,11,12,2,"#a3f2d5");
        rect(8,14,12,2,"#8aded0"); rect(9,17,11,1,"#95cac2"); rect(11,5,6,1,"#efffea"); break;
      case "bolt":
        polygon([12,2,21,2,15,10,21,10,7,23,10,14,4,14], "#8058b4");
        polygon([11,2,19,2,13,10,18,10,7,20,10,12,4,12], violet);
        path([11,3,16,3], "#f3deff",1); path([9,6,6,10], "#f3deff",1); break;
      case "tea":
        path([13,8,16,2,20,2], "#ff9ec8",2); rect(4,7,16,3,"#ffe1ee");
        polygon([5,10,19,10,17,21,8,21], "#8f4c66"); polygon([6,10,18,10,16,20,9,20], "#e5a86e");
        polygon([6,10,18,10,18,13,6,13], "#f7c9a1"); rect(7,13,2,4,"#ffdeb8"); rect(9,20,7,1,"#f2b4c6");
        rect(6,7,12,1,"#fff3f5"); rect(14,3,2,2,"#ffcde2"); break;
      case "pot":
        path([7,2,6,4,7,5],cream,1); path([12,1,11,3,12,5],cream,1); path([17,2,16,4,17,5],cream,1);
        rect(2,10,3,3,"#efa875"); rect(19,10,3,3,"#efa875");
        polygon([4,9,20,9,20,14,17,17,7,17,4,14], "#e78356"); rect(5,8,14,2,"#ffd190");
        rect(6,8,2,1,"#a7d66f"); rect(10,8,4,1,"#ffe5ad"); rect(16,8,2,1,"#f79170"); rect(8,11,6,2,"#ffba81");
        polygon([7,20,9,16,11,19,13,16,15,19,17,17,17,21,7,21],gold); break;
      case "trophy":
        path([7,6,2,6,2,10,4,12,7,12], gold,2); path([15,6,20,6,20,10,18,12,15,12],gold,2);
        polygon([6,4,18,4,18,11,15,15,13,16,10,16,7,13,6,11],gold);
        rect(7,4,9,2,cream); rect(8,7,2,4,"#fff0af"); rect(11,15,3,4,"#dc9d47"); rect(8,19,9,2,gold); break;
      case "tv":
        path([6,1,11,6,16,1],violet,1);
        polygon([2,6,21,6,23,8,23,18,21,20,3,20,1,18,1,8],violet);
        rect(3,8,14,9,"#3d2b55"); rect(5,10,9,1,"#9177ad"); rect(5,12,6,1,"#9177ad");
        rect(19,9,2,2,"#473652"); rect(19,14,2,2,"#473652"); rect(4,20,3,2,violet); rect(17,20,3,2,violet); break;
      case "gamepad":
        polygon([4,6,19,6,21,8,23,16,21,19,18,19,15,15,8,15,5,19,2,19,1,17,2,9], "#bc94e5");
        rect(5,6,12,1,"#efd4ff"); rect(4,10,6,2,"#4a375b"); rect(6,8,2,6,"#4a375b");
        rect(16,9,2,2,"#fcbedc"); rect(19,11,2,2,"#b3f3cf"); rect(11,12,3,1,"#6d5385"); break;
      case "plush-fish":
        polygon([1,7,7,10,10,7,14,6,18,7,22,11,23,13,19,16,14,18,9,17,7,14,1,17,3,12],"#a54b59");
        polygon([3,8,8,11,11,8,17,8,21,11,21,13,17,16,10,16,8,13,3,15,5,12],"#ff9a82");
        polygon([9,8,12,3,15,4,14,8],"#f4736a"); polygon([11,16,14,20,17,16],"#f17968");
        rect(16,9,3,3,"#ffe5cb"); rect(17,10,2,2,dark);
        rect(10,12,2,1,"#ed685c"); rect(12,13,2,1,"#ed685c"); rect(14,12,2,1,"#ed685c");
        rect(19,13,2,1,"#cf655f"); break;
      case "fish":
        polygon([1,6,6,9,10,6,16,6,21,10,23,12,20,15,15,18,10,18,6,15,1,18,2,12], "#916ab7");
        polygon([2,7,7,10,11,7,16,7,21,11,22,12,18,15,14,16,10,16,7,13,2,16,3,12], "#d6a3ed");
        polygon([8,9,11,4,14,5,13,8], "#82cdc9"); polygon([9,16,12,19,15,16], "#83cfca");
        rect(15,9,3,3,"#fff0f5"); rect(17,10,2,2,dark); rect(11,12,2,1,"#efd1fa"); rect(6,11,1,2,"#9b75be"); break;
      case "siren":
        path([11,1,11,3],cream,2); path([3,4,5,6],"#ffb485",1); path([18,5,20,3],"#ffb485",1);
        polygon([5,17,5,10,8,6,15,6,18,9,19,17],"#d25654"); polygon([7,16,7,10,9,7,14,7,16,9,16,16],"#ff9379");
        rect(8,10,2,4,"#ffdfb5"); rect(4,17,16,2,"#e4a576"); rect(2,19,20,2,"#a87a6a"); break;
      case "trend": path([2,16,8,10,12,14,20,6],lime); path([15,6,20,6,20,11],lime); break;
      case "pause": rect(5,3,5,17); rect(14,3,5,17); break;
      case "waffles":
        polygon([4,5,13,2,19,4,22,8,21,14,12,20,7,17,3,12],"#a26429");
        for (const [x,y] of [[5,6],[10,4],[15,4],[6,11],[11,9],[16,9],[10,14],[15,13]]) {
          rect(x,y,4,4,"#f4b44f"); rect(x+1,y,2,1,"#ffe1a2"); rect(x,y+1,1,2,"#ffe1a2");
        }
        polygon([3,12,8,16,12,17,18,15,15,21,10,23,5,19],"#f69a80");
        path([4,13,10,18,16,16],"#ffe6c8",1); break;
      case "tart":
        polygon([2,10,5,6,10,4,17,4,22,8,22,14,18,19,7,20,2,16],"#98552b");
        polygon([2,10,6,5,16,4,21,7,22,12,18,16,8,17,3,14],"#ffd887");
        polygon([5,10,8,7,15,6,18,8,19,11,16,14,9,14,6,13],"#f7ab3f");
        rect(9,8,4,2,"#a65b2c"); rect(14,11,3,2,"#bb6a2e"); path([5,16,9,18,16,17],"#e69d51",1); break;
      case "boba":
        path([13,7,15,1,17,1],"#ff9cc5",2);
        polygon([4,7,20,7,18,21,15,23,9,23,6,21],"#f8dfbb");
        polygon([6,10,18,10,17,20,15,21,9,21,7,20],"#cc924c");
        rect(3,6,18,3,"#ffeabe"); rect(8,11,1,5,"#ffe4aa");
        for (const [x,y] of [[9,17],[13,18],[15,15],[9,20],[15,20]]) rect(x,y,2,2,"#523c39");
        break;
      case "coffee":
        polygon([4,6,20,6,18,22,7,22],"#eee4c4"); rect(6,11,13,7,"#bd7857"); rect(8,15,9,2,"#d99464");
        rect(3,5,18,3,"#644d52"); rect(5,3,14,2,"#ae9792"); rect(6,2,12,1,"#d4bfab"); break;
      case "slice":
        polygon([3,3,10,3,21,9,21,13,5,22,3,21],"#b97034");
        polygon([4,6,9,6,18,11,5,20],"#ffd663");
        path([4,3,10,4,20,9],"#f3ae6c",3); rect(7,9,3,3,"#da6853"); rect(12,11,3,2,"#ca5543"); rect(6,15,2,2,"#cf5848"); break;
      case "screen": path([2,3,21,3,21,16,2,16,2,3]); rect(10,17,4,3); rect(6,20,12,2); break;
      case "popout": path([12,5,3,5,3,20,19,20,19,12]); path([13,2,21,2,21,10]); path([20,3,11,12]); break;
      case "play": polygon([6,3,21,12,6,21],ink); break;
      case "stop": rect(5,5,14,14); break;
      case "gear":
        polygon([9,1,15,1,16,5,19,4,22,8,20,11,20,13,22,16,19,20,16,19,15,23,9,23,8,19,5,20,2,16,4,13,4,11,2,8,5,4,8,5],ink);
        polygon([10,7,14,7,17,10,17,14,14,17,10,17,7,14,7,10], "#242629"); break;
      case "sound": case "mute":
        polygon([2,9,6,9,12,4,12,20,6,15,2,15],ink);
        if (name === "mute") { path([15,8,21,14]); path([21,8,15,14]); }
        else { path([15,8,17,11,17,13,15,16],ink,1); path([18,5,21,9,21,14,18,19],ink,1); } break;
      case "clock": path([8,2,15,2,20,7,20,15,15,20,7,20,2,15,2,8,8,2],ink,2); path([11,6,11,12,16,14],ink,2); break;
      case "calendar": path([3,5,20,5,20,20,3,20,3,5]); rect(4,9,16,2); rect(6,2,2,6); rect(16,2,2,6); rect(7,13,3,2); rect(13,13,3,2); break;
      case "shuffle": path([2,6,6,6,15,16,19,16]); path([16,13,20,16,16,19]); path([2,16,6,16,9,12]); path([12,9,15,6,20,6]); path([16,3,20,6,16,9]); break;
      case "cross": path([5,5,17,17]); path([17,5,5,17]); break;
      case "disk": path([3,3,17,3,20,6,20,20,3,20,3,3]); path([7,4,7,9,15,9,15,4],ink,1); path([7,19,7,13,16,13,16,19],ink,1); break;
      case "flag": rect(4,3,2,18); polygon([6,4,20,4,17,8,20,12,6,12],lime); break;
      case "meal": rect(3,9,18,3,cream); polygon([4,12,20,12,17,18,7,18],"#e89378"); rect(7,18,10,2,"#f7bb9b"); rect(6,7,11,2,"#ffe6c4"); rect(8,5,4,2,"#9abc68"); rect(14,6,3,2,"#e67c63"); break;
    }
  }
  function draw(canvas, name = canvas.dataset.pixel) {
    const size = 24;
    canvas.dataset.pixel = name;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paint(name, (x,y,w,h,color) => { ctx.fillStyle = color; ctx.fillRect(x,y,w,h); }, getComputedStyle(canvas).color);
  }
  return { draw, paint };
})();
if (typeof module !== "undefined" && module.exports) module.exports = Pixels;
