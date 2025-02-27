package org.gardler.biglittlechallenge.core.model;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Iterator;

/**
 * A Card represents a single card in the game. There are usually various
 * collections of Cards in the game, such as a Deck, a Hand and a Discard pile.
 *
 */
public class Card implements Serializable {
	private static final long serialVersionUID = -2423089035312679270L;
	String name;
	public HashMap<String, String> properties = new HashMap<String, String>();

	public Card() {
		this.setName("Default Card");
	}
	
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Card(String name) {
		this.setName(name);
	}

	public String toString() {
		String result = getName() + "\n";
		Iterator<String> itr = properties.keySet().iterator();
		while (itr.hasNext()) {
			String key = itr.next();
			String value = properties.get(key);
			result = result + "\t" + key + " = " + value + "\n";
		}
		return result;
	}

	public void writeProperty(String key, String value) {
		properties.put(key, value);
	}

	public String readProperty(String key) {
		return properties.get(key);
	}

	public Integer getPropertyAsInteger(String key) {
		if (properties.containsKey(key)) {
			return Integer.parseInt(properties.get(key));
		} else {
			throw new IllegalArgumentException("Card property '" + key + "' does not exist.");
		}
	}

}
